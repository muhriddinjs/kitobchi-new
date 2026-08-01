import request from 'supertest';
import type { User } from '@prisma/client';
import { TestHarness } from './helpers';

/**
 * A rating is only worth showing if it can't be moved by someone who never
 * bought anything. Reviews used to be open to anyone who had sent a single
 * chat message; these assertions pin the rule down.
 */
describe('Marking sold and reviewing (e2e)', () => {
  let h: TestHarness;
  let seller: User;
  let buyer: User;
  let stranger: User;

  beforeAll(async () => {
    h = await TestHarness.create();
    seller = await h.createUser();
    buyer = await h.createUser();
    stranger = await h.createUser();
  });

  afterAll(async () => {
    await h.teardown();
  });

  /** A listing whose buyer has asked for the seller's number. */
  async function listingWithInterestedBuyer() {
    const listing = await h.createListing(seller.id);
    await request(h.server())
      .get(`/api/v1/listings/${listing.id}/contact`)
      .set('Authorization', `Bearer ${h.token(buyer.id)}`)
      .expect(200);
    return listing;
  }

  describe('mark-sold', () => {
    it('records a buyer who showed interest', async () => {
      const listing = await listingWithInterestedBuyer();

      const res = await request(h.server())
        .post(`/api/v1/listings/${listing.id}/mark-sold`)
        .set('Authorization', `Bearer ${h.token(seller.id)}`)
        .send({ soldToUserId: buyer.id })
        .expect(201);

      expect(res.body.status).toBe('SOLD');
    });

    it('allows marking sold with no buyer at all', async () => {
      const listing = await h.createListing(seller.id);

      await request(h.server())
        .post(`/api/v1/listings/${listing.id}/mark-sold`)
        .set('Authorization', `Bearer ${h.token(seller.id)}`)
        .send({})
        .expect(201);
    });

    // Otherwise the seller could hand the review permission to an account
    // they control.
    it('refuses a buyer who never contacted the seller', async () => {
      const listing = await h.createListing(seller.id);

      await request(h.server())
        .post(`/api/v1/listings/${listing.id}/mark-sold`)
        .set('Authorization', `Bearer ${h.token(seller.id)}`)
        .send({ soldToUserId: stranger.id })
        .expect(400);
    });

    it('refuses the seller naming themselves', async () => {
      const listing = await h.createListing(seller.id);

      await request(h.server())
        .post(`/api/v1/listings/${listing.id}/mark-sold`)
        .set('Authorization', `Bearer ${h.token(seller.id)}`)
        .send({ soldToUserId: seller.id })
        .expect(400);
    });

    it('refuses a malformed buyer id', async () => {
      const listing = await h.createListing(seller.id);

      await request(h.server())
        .post(`/api/v1/listings/${listing.id}/mark-sold`)
        .set('Authorization', `Bearer ${h.token(seller.id)}`)
        .send({ soldToUserId: 'not-a-uuid' })
        .expect(400);
    });

    it('refuses marking the same listing sold twice', async () => {
      const listing = await h.createListing(seller.id, { status: 'SOLD' });

      await request(h.server())
        .post(`/api/v1/listings/${listing.id}/mark-sold`)
        .set('Authorization', `Bearer ${h.token(seller.id)}`)
        .send({})
        .expect(400);
    });

    it("refuses a non-owner marking someone else's listing sold", async () => {
      const listing = await h.createListing(seller.id);

      await request(h.server())
        .post(`/api/v1/listings/${listing.id}/mark-sold`)
        .set('Authorization', `Bearer ${h.token(stranger.id)}`)
        .send({})
        .expect(403);
    });
  });

  describe('reviews', () => {
    it('lets the recorded buyer review once, and updates the aggregate', async () => {
      const listing = await listingWithInterestedBuyer();
      await request(h.server())
        .post(`/api/v1/listings/${listing.id}/mark-sold`)
        .set('Authorization', `Bearer ${h.token(seller.id)}`)
        .send({ soldToUserId: buyer.id })
        .expect(201);

      const before = await request(h.server())
        .get(`/api/v1/listings/${listing.id}/can-review`)
        .set('Authorization', `Bearer ${h.token(buyer.id)}`)
        .expect(200);
      expect(before.body.canReview).toBe(true);

      const review = await request(h.server())
        .post(`/api/v1/listings/${listing.id}/reviews`)
        .set('Authorization', `Bearer ${h.token(buyer.id)}`)
        .send({ rating: 5, comment: 'Zoʻr sotuvchi' })
        .expect(201);
      expect(review.body.rating).toBe(5);

      const profile = await request(h.server())
        .get(`/api/v1/users/${seller.id}`)
        .expect(200);
      expect(profile.body.ratingCount).toBeGreaterThan(0);

      // A second one from the same buyer is a duplicate, not an edit.
      await request(h.server())
        .post(`/api/v1/listings/${listing.id}/reviews`)
        .set('Authorization', `Bearer ${h.token(buyer.id)}`)
        .send({ rating: 1 })
        .expect(400);

      const after = await request(h.server())
        .get(`/api/v1/listings/${listing.id}/can-review`)
        .set('Authorization', `Bearer ${h.token(buyer.id)}`)
        .expect(200);
      expect(after.body.canReview).toBe(false);
    });

    // The old rule let anyone who had opened a conversation leave a review,
    // so a competitor could move a seller's rating with one message.
    it('refuses a review from someone who is not the recorded buyer', async () => {
      const listing = await listingWithInterestedBuyer();
      await request(h.server())
        .post(`/api/v1/listings/${listing.id}/mark-sold`)
        .set('Authorization', `Bearer ${h.token(seller.id)}`)
        .send({ soldToUserId: buyer.id })
        .expect(201);

      await request(h.server())
        .post(`/api/v1/listings/${listing.id}/reviews`)
        .set('Authorization', `Bearer ${h.token(stranger.id)}`)
        .send({ rating: 1, comment: 'raqobatchi' })
        .expect(403);

      const res = await request(h.server())
        .get(`/api/v1/listings/${listing.id}/can-review`)
        .set('Authorization', `Bearer ${h.token(stranger.id)}`)
        .expect(200);
      expect(res.body.canReview).toBe(false);
    });

    it('refuses a review when no buyer was recorded', async () => {
      const listing = await h.createListing(seller.id, { status: 'SOLD' });

      await request(h.server())
        .post(`/api/v1/listings/${listing.id}/reviews`)
        .set('Authorization', `Bearer ${h.token(buyer.id)}`)
        .send({ rating: 5 })
        .expect(403);
    });

    it('refuses a review on a listing that is not sold', async () => {
      const listing = await h.createListing(seller.id);

      await request(h.server())
        .post(`/api/v1/listings/${listing.id}/reviews`)
        .set('Authorization', `Bearer ${h.token(buyer.id)}`)
        .send({ rating: 5 })
        .expect(400);
    });

    it('rejects an out-of-range rating', async () => {
      const listing = await h.createListing(seller.id, { status: 'SOLD' });

      await request(h.server())
        .post(`/api/v1/listings/${listing.id}/reviews`)
        .set('Authorization', `Bearer ${h.token(buyer.id)}`)
        .send({ rating: 9 })
        .expect(400);
    });
  });
});
