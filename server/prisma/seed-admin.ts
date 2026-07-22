import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Role } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";
import { getDatabaseUrl } from "../utils/databaseUrl";

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
const adminName = process.env.ADMIN_NAME?.trim();
const name = adminName || "Admin";

if (!email || !password) {
	throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required");
}

const pool = new Pool({ connectionString: getDatabaseUrl() });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

try {
	const passwordHash = await hashPassword(password);

	const user = await prisma.user.upsert({
		where: { email },
		update: {
			role: Role.ADMIN,
			emailVerified: true,
			...(adminName ? { name: adminName } : {})
		},
		create: {
			email,
			name,
			role: Role.ADMIN,
			emailVerified: true
		}
	});

	const account = await prisma.account.findFirst({
		where: {
			userId: user.id,
			providerId: "credential"
		}
	});

	if (account) {
		await prisma.account.update({
			where: { id: account.id },
			data: { password: passwordHash }
		});
	} else {
		await prisma.account.create({
			data: {
				userId: user.id,
				accountId: user.id,
				providerId: "credential",
				password: passwordHash
			}
		});
	}

	console.log(`Admin is ready: ${email}`);
} finally {
	await prisma.$disconnect();
	await pool.end();
}
