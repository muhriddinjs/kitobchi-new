import request from 'supertest';
import type { Listing, User } from '@prisma/client';
import { TestHarness } from './helpers';

/**
 * Seller phone numbers used to ship in every public listing payload, which
 * made the whole seller base scrapeable with one unauthenticated request.
 * These assertions are the guard against that coming back.
 */
describe('Seller contact details (e2e)', () => {
  let h: TestHarness;
  let seller: User;
  let buyer: User;
  let listing: Listing;

  beforeAll(async () => {
    h = await TestHarness.create();
    seller = await h.createUser({ telegramUsername: 'sotuvchi' });
    buyer = await h.createUser();
    listing = await h.createListing(seller.id);
  });

  afterAll(async () => {
    await h.teardown();
  });

  it('keeps contact details out of the single-listing payload', async () => {
    const res = await request(h.server())
      .get(`/api/v1/listings/${listing.id}`)
      .expect(200);

    expect(res.body.seller).not.toHaveProperty('phone');
    expect(res.body.seller).not.toHaveProperty('telegramUsername');
    expect(res.body.seller).toHaveProperty('name');
  });

  it('keeps contact details out of the browse payload', async () => {
    const res = await request(h.server())
      .get(`/api/v1/listings?sellerId=${seller.id}`)
      .expect(200);

    expect(res.body.items.length).toBeGreaterThan(0);
    for (const item of res.body.items) {
      expect(item.seller).not.toHaveProperty('phone');
      expect(item.seller).not.toHaveProperty('telegramUsername');
    }
  });

  // `include` returns every scalar column, so a new field on Listing would
  // become public the moment it's added. The select is explicit for exactly
  // this reason — soldToUserId was leaking that way.
  it('keeps the recorded buyer out of the public payload', async () => {
    const res = await request(h.server())
      .get(`/api/v1/listings/${listing.id}`)
      .expect(200);

    expect(res.body).not.toHaveProperty('soldToUserId');
  });

  it('keeps the phone out of the public profile', async () => {
    const res = await request(h.server())
      .get(`/api/v1/users/${seller.id}`)
      .expect(200);

    expect(res.body).not.toHaveProperty('phone');
    expect(res.body).not.toHaveProperty('telegramUsername');
    expect(res.body.name).toBe(seller.name);
  });

  it('refuses the contact endpoint without a token', async () => {
    await request(h.server())
      .get(`/api/v1/listings/${listing.id}/contact`)
      .expect(401);
  });

  it('serves contact details to a signed-in user', async () => {
    const res = await request(h.server())
      .get(`/api/v1/listings/${listing.id}/contact`)
      .set('Authorization', `Bearer ${h.token(buyer.id)}`)
      .expect(200);

    expect(res.body).toEqual({
      phone: seller.phone,
      telegramUsername: 'sotuvchi',
    });
  });

  it('records the asker as a buyer candidate, but not the seller', async () => {
    await request(h.server())
      .get(`/api/v1/listings/${listing.id}/contact`)
      .set('Authorization', `Bearer ${h.token(buyer.id)}`)
      .expect(200);

    // The seller opening their own listing is not a lead.
    await request(h.server())
      .get(`/api/v1/listings/${listing.id}/contact`)
      .set('Authorization', `Bearer ${h.token(seller.id)}`)
      .expect(200);

    const res = await request(h.server())
      .get(`/api/v1/listings/${listing.id}/buyer-candidates`)
      .set('Authorization', `Bearer ${h.token(seller.id)}`)
      .expect(200);

    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ id: buyer.id, source: 'contact' });
  });

  it('hides contact details for a hidden listing', async () => {
    const hidden = await h.createListing(seller.id, { status: 'HIDDEN' });

    await request(h.server())
      .get(`/api/v1/listings/${hidden.id}/contact`)
      .set('Authorization', `Bearer ${h.token(buyer.id)}`)
      .expect(404);
  });

  it("refuses to list another seller's buyer candidates", async () => {
    await request(h.server())
      .get(`/api/v1/listings/${listing.id}/buyer-candidates`)
      .set('Authorization', `Bearer ${h.token(buyer.id)}`)
      .expect(403);
  });
});
