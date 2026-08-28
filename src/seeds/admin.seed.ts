import 'dotenv/config';
import { Repository } from 'typeorm';
import { auth } from '../auth';
import { dataSource } from '../typeorm/data-source';
import { AccountStatus, Admin, AdminRole } from '../modules/admin/admin.entity';
// The shared data source only loads entities from the root "typeorm/entities"
// folder (Better Auth tables). Register the Admin entity manually so its
// repository is available in this seed script.
type EntityClass = new (...args: never[]) => unknown;
(dataSource.options.entities as Array<string | EntityClass>).push(Admin);
const SEED_PASSWORD = 'Password123!';

interface SeedAccount {
  email: string;
  firstName: string;
  lastName: string;
  role: AdminRole;
  status: AccountStatus;
  approved: boolean;
}

const SEED_ACCOUNTS: SeedAccount[] = [
  {
    email: 'superadmin@seed.local',
    firstName: 'Super',
    lastName: 'Admin',
    role: AdminRole.SUPER_ADMIN,
    status: AccountStatus.ACTIVE,
    approved: false,
  },
  {
    email: 'moderator.active@seed.local',
    firstName: 'Active',
    lastName: 'Moderator',
    role: AdminRole.MODERATOR,
    status: AccountStatus.ACTIVE,
    approved: true,
  },
  {
    email: 'moderator.pending@seed.local',
    firstName: 'Pending',
    lastName: 'Moderator',
    role: AdminRole.MODERATOR,
    status: AccountStatus.PENDING,
    approved: false,
  },
  {
    email: 'moderator.rejected@seed.local',
    firstName: 'Rejected',
    lastName: 'Moderator',
    role: AdminRole.MODERATOR,
    status: AccountStatus.REJECTED,
    approved: false,
  },
  {
    email: 'moderator.suspended@seed.local',
    firstName: 'Suspended',
    lastName: 'Moderator',
    role: AdminRole.MODERATOR,
    status: AccountStatus.SUSPENDED,
    approved: false,
  },
];

async function getAdminByEmail(
  adminRepo: Repository<Admin>,
  email: string,
): Promise<Admin | null> {
  const admins = await adminRepo.find({ relations: ['user', 'approvedBy'] });
  return (
    admins.find(
      (admin) => admin.user?.email?.toLowerCase() === email.toLowerCase(),
    ) ?? null
  );
}

async function main(): Promise<void> {
  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }

  const adminRepo = dataSource.getRepository(Admin);
  const seededAdmins = new Map<string, Admin>();

  for (const account of SEED_ACCOUNTS) {
    let admin = await getAdminByEmail(adminRepo, account.email);

    if (admin) {
      // Idempotency: account already exists, only fix drifted data.
      let dirty = false;
      if (admin.role !== account.role) {
        admin.role = account.role;
        dirty = true;
      }
      if (admin.status !== account.status) {
        admin.status = account.status;
        dirty = true;
      }
      if (dirty) {
        admin = await adminRepo.save(admin);
        console.log(`[UPDATED] ${account.email}`);
      } else {
        console.log(`[SKIPPED] ${account.email} (already exists)`);
      }
    } else {
      try {
        // 1) Create the Better Auth user (email + password).
        const result = (await auth.api.signUpEmail({
          body: {
            email: account.email,
            password: SEED_PASSWORD,
            name: `${account.firstName} ${account.lastName}`,
            first_name: account.firstName,
            last_name: account.lastName,
          },
        })) as { user: { id: string } };

        // 2) Create the admin profile linked to the auth user.
        admin = adminRepo.create({
          userId: result.user.id,
          role: account.role,
          status: account.status,
        });

        if (account.role === AdminRole.SUPER_ADMIN) {
          admin.approved_at = new Date();
        }

        admin = await adminRepo.save(admin);
        console.log(
          `[CREATED] ${account.email} (${account.role} / ${account.status})`,
        );
      } catch (error) {
        console.error(`[ERROR] Failed to seed ${account.email}:`, error);
        continue;
      }
    }

    seededAdmins.set(account.email, admin);
  }

  // 3) Link approved moderators to the SUPER_ADMIN.
  const superAdmin = seededAdmins.get('superadmin@seed.local');

  if (superAdmin) {
    for (const account of SEED_ACCOUNTS.filter((a) => a.approved)) {
      const moderator = seededAdmins.get(account.email);
      if (moderator && !moderator.approvedBy) {
        moderator.approvedBy = superAdmin;
        moderator.approved_at = moderator.approved_at ?? new Date();
        await adminRepo.save(moderator);
        console.log(`[LINKED] ${account.email} to SUPER_ADMIN as approver`);
      }
    }
  }

  console.log('[SUCCESS] Admin seed finished successfully');
}

main()
  .then(async () => {
    if (dataSource.isInitialized) await dataSource.destroy();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('[FAILED] Admin seed failed:', error);
    if (dataSource.isInitialized) await dataSource.destroy();
    process.exit(1);
  });
