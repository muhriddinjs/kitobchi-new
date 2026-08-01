import request from 'supertest';
import type { User } from '@prisma/client';
import { TestHarness } from './helpers';

describe('Bans and listing moderation (e2e)', () => {
  let h: TestHarness;
  let admin: User;
  let seller: User;

  beforeAll(async () => {
    h = await TestHarness.create();
    admin = await h.createUser({ role: 'ADMIN' });
    seller = await h.createUser();
  });

  afterAll(async () => {
    await h.teardown();
  });

  describe('admin route access', () => {
    it('refuses anonymous callers', async () => {
      await request(h.server()).get('/api/v1/admin/users').expect(401);
    });

    // The page also checks the role client-side, but that's cosmetic — this
    // is the check that actually matters.
    it('refuses a signed-in non-admin', async () => {
      await request(h.server())
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${h.token(seller.id)}`)
        .expect(403);
    });

    it('allows an admin', async () => {
      await request(h.server())
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${h.token(admin.id)}`)
        .expect(200);
    });
  });

  describe('banning', () => {
    it('revokes an already-issued token immediately', async () => {
      const victim = await h.createUser();
      const token = h.token(victim.id);

      await request(h.server())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      await request(h.server())
        .post(`/api/v1/admin/users/${victim.id}/ban`)
        .set('Authorization', `Bearer ${h.token(admin.id)}`)
        .send({ reason: 'Soxta eʼlonlar' })
        .expect(201);

      // The same token, not a new one: the ban must not wait out the
      // 15-minute access token lifetime.
      await request(h.server())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);
    });

    it("hides the banned account's active listings", async () => {
      const victim = await h.createUser();
      const active = await h.createListing(victim.id);
      const sold = await h.createListing(victim.id, { status: 'SOLD' });

      const res = await request(h.server())
        .post(`/api/v1/admin/users/${victim.id}/ban`)
        .set('Authorization', `Bearer ${h.token(admin.id)}`)
        .send({ reason: 'test' })
        .expect(201);

      expect(res.body.hiddenListings).toBe(1);

      const after = await h.prisma.listing.findMany({
        where: { id: { in: [active.id, sold.id] } },
        select: { id: true, status: true, moderatedAt: true },
      });

      const activeAfter = after.find((l) => l.id === active.id);
      expect(activeAfter?.status).toBe('HIDDEN');
      // Marked as moderated, so an unban doesn't hand back a restore button.
      expect(activeAfter?.moderatedAt).not.toBeNull();
      expect(after.find((l) => l.id === sold.id)?.status).toBe('SOLD');
    });

    it('restores access on unban', async () => {
      const victim = await h.createUser({ bannedAt: new Date() });

      await request(h.server())
        .post(`/api/v1/admin/users/${victim.id}/unban`)
        .set('Authorization', `Bearer ${h.token(admin.id)}`)
        .expect(201);

      await request(h.server())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${h.token(victim.id)}`)
        .expect(200);
    });

    it('refuses to ban yourself', async () => {
      await request(h.server())
        .post(`/api/v1/admin/users/${admin.id}/ban`)
        .set('Authorization', `Bearer ${h.token(admin.id)}`)
        .send({ reason: 'test' })
        .expect(400);
    });

    it('refuses to ban another admin', async () => {
      const other = await h.createUser({ role: 'ADMIN' });

      await request(h.server())
        .post(`/api/v1/admin/users/${other.id}/ban`)
        .set('Authorization', `Bearer ${h.token(admin.id)}`)
        .send({ reason: 'test' })
        .expect(403);
    });

    it('requires a reason', async () => {
      const victim = await h.createUser();

      await request(h.server())
        .post(`/api/v1/admin/users/${victim.id}/ban`)
        .set('Authorization', `Bearer ${h.token(admin.id)}`)
        .send({})
        .expect(400);
    });
  });

  describe('hiding and restoring', () => {
    it('lets a seller restore a listing they hid themselves', async () => {
      const listing = await h.createListing(seller.id);

      await request(h.server())
        .delete(`/api/v1/listings/${listing.id}`)
        .set('Authorization', `Bearer ${h.token(seller.id)}`)
        .expect(200);

      const res = await request(h.server())
        .post(`/api/v1/listings/${listing.id}/unhide`)
        .set('Authorization', `Bearer ${h.token(seller.id)}`)
        .expect(201);

      expect(res.body.status).toBe('ACTIVE');
    });

    it('refuses to restore a listing that is not hidden', async () => {
      const listing = await h.createListing(seller.id);

      await request(h.server())
        .post(`/api/v1/listings/${listing.id}/unhide`)
        .set('Authorization', `Bearer ${h.token(seller.id)}`)
        .expect(400);
    });

    // Otherwise every takedown is one click away from being undone.
    it('refuses to let a seller restore an admin-hidden listing', async () => {
      const listing = await h.createListing(seller.id);

      await request(h.server())
        .post(`/api/v1/admin/listings/${listing.id}/hide`)
        .set('Authorization', `Bearer ${h.token(admin.id)}`)
        .expect(201);

      await request(h.server())
        .post(`/api/v1/listings/${listing.id}/unhide`)
        .set('Authorization', `Bearer ${h.token(seller.id)}`)
        .expect(403);
    });

    it('hands control back when an admin restores the listing', async () => {
      const listing = await h.createListing(seller.id);
      const adminAuth = `Bearer ${h.token(admin.id)}`;

      await request(h.server())
        .post(`/api/v1/admin/listings/${listing.id}/hide`)
        .set('Authorization', adminAuth)
        .expect(201);

      const restored = await request(h.server())
        .post(`/api/v1/admin/listings/${listing.id}/unhide`)
        .set('Authorization', adminAuth)
        .expect(201);

      expect(restored.body.status).toBe('ACTIVE');
      expect(restored.body.moderatedAt).toBeNull();

      // Mark cleared, so the seller owns it again.
      await request(h.server())
        .delete(`/api/v1/listings/${listing.id}`)
        .set('Authorization', `Bearer ${h.token(seller.id)}`)
        .expect(200);

      await request(h.server())
        .post(`/api/v1/listings/${listing.id}/unhide`)
        .set('Authorization', `Bearer ${h.token(seller.id)}`)
        .expect(201);
    });

    it("refuses to let a stranger restore someone else's listing", async () => {
      const listing = await h.createListing(seller.id, { status: 'HIDDEN' });
      const stranger = await h.createUser();

      await request(h.server())
        .post(`/api/v1/listings/${listing.id}/unhide`)
        .set('Authorization', `Bearer ${h.token(stranger.id)}`)
        .expect(403);
    });

    it('shows hidden listings to admins but not to the public', async () => {
      const listing = await h.createListing(seller.id, { status: 'HIDDEN' });

      const publicRes = await request(h.server())
        .get(`/api/v1/listings?sellerId=${seller.id}&limit=100`)
        .expect(200);
      expect(
        publicRes.body.items.some((l: { id: string }) => l.id === listing.id),
      ).toBe(false);

      const adminRes = await request(h.server())
        .get(`/api/v1/admin/listings?status=HIDDEN&limit=100`)
        .set('Authorization', `Bearer ${h.token(admin.id)}`)
        .expect(200);
      expect(
        adminRes.body.items.some((l: { id: string }) => l.id === listing.id),
      ).toBe(true);
    });
  });
});
