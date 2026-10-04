# Security Specification (`security_spec.md`)

## 1. Data Invariants
1. **PII Isolation**: `/profiles/{userId}` never stores email addresses, phone numbers, or street addresses. It only contains public naturalist metadata (`uid`, `handle`, `displayName`, `bio`, `avatarUrl`, `location`, `specialty`, `isPublic`, `createdAt`, `updatedAt`).
2. **Identity Integrity**:
   - A `CollectorProfile` at `/profiles/{userId}` can only be created or updated if `userId == request.auth.uid` AND `incoming().uid == request.auth.uid`.
   - A `Specimen` at `/specimens/{specimenId}` can only be created if `incoming().ownerId == request.auth.uid` and `exists(/databases/$(database)/documents/profiles/$(request.auth.uid))`.
   - A `FollowRelation` at `/follows/{followId}` can only be created if `incoming().followerId == request.auth.uid`, `incoming().followerId != incoming().followingId`, and `exists(/databases/$(database)/documents/profiles/$(incoming().followingId))`.
3. **Temporal Integrity**: All `createdAt` fields must equal `request.time` on `create` and remain immutable on `update`. All `updatedAt` fields must equal `request.time` on `create` and `update`.
4. **Query Enforcer**:
   - `list` on `/profiles` requires `resource.data.isPublic == true`.
   - `list` on `/specimens` requires `resource.data.isPublic == true || (isSignedIn() && resource.data.ownerId == request.auth.uid)`.
   - `list` on `/follows` requires `isSignedIn() && (resource.data.followerId == request.auth.uid || resource.data.followingId == request.auth.uid)`.

## 2. The "Dirty Dozen" Payloads
1. **Identity Spoofing on Profile Create**: Authenticated user `user_A` attempts to write to `/profiles/user_B` with `uid: "user_B"`. -> `PERMISSION_DENIED`.
2. **Shadow Field Injection on Profile Create**: `user_A` sends valid profile fields plus `"isAdmin": true`. -> `PERMISSION_DENIED` via `hasOnly()`.
3. **Unverified Email Write**: `user_A` with `email_verified: false` attempts to create a specimen. -> `PERMISSION_DENIED`.
4. **Timestamp Forgery on Specimen Create**: `user_A` provides a past client timestamp for `createdAt` instead of `request.time`. -> `PERMISSION_DENIED`.
5. **Orphaned Specimen Creation**: `user_A` attempts to create a specimen before creating their `/profiles/user_A` document. -> `PERMISSION_DENIED` via `exists()` check.
6. **Cross-User Specimen Hijack on Update**: `user_A` attempts to update `ownerId` on an existing specimen to `user_B`. -> `PERMISSION_DENIED`.
7. **Update-Gap Value Poisoning on Specimen**: `user_A` updates `scientificName` to an empty string `""` or a 5,000-character string. -> `PERMISSION_DENIED` via `isValidSpecimen(incoming())`.
8. **Invalid Category Enum on Specimen**: `user_A` creates a specimen with `category: "mineral"`. -> `PERMISSION_DENIED`.
9. **ID Poisoning Attack**: `user_A` attempts to create a specimen with a 200-character or special-character document ID. -> `PERMISSION_DENIED` via `isValidId()`.
10. **Self-Follow Exploit**: `user_A` creates a follow document with `followerId: "user_A"` and `followingId: "user_A"`. -> `PERMISSION_DENIED`.
11. **Unbounded Blanket List on Follows**: `user_A` attempts to list all documents in `/follows` without filtering by `followerId == user_A` or `followingId == user_A`. -> `PERMISSION_DENIED`.
12. **Private Specimen Scraping**: `user_B` attempts to `get` or `list` a specimen owned by `user_A` where `isPublic == false`. -> `PERMISSION_DENIED`.
