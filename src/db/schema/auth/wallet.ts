import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./user";

export const encrypted_wallets = pgTable("encrypted_wallets", {
    id: text("id").primaryKey(),
    user_id: text("user_id")
        .notNull()
        .unique()
        .references(() => user.id, { onDelete: "cascade" }),
    address: text("address").notNull().unique(),
    encrypted_privkey: text("encrypted_privkey").notNull(),
    encrypted_mnemonic: text("encrypted_mnemonic"), // Encrypted 12-word recovery phrase
    iv: text("iv").notNull(),
    mnemonic_iv: text("mnemonic_iv"), // Separate IV for mnemonic encryption
    salt: text("salt").notNull(),
    passkey_credential_id: text("passkey_credential_id").notNull(),
    created_at: timestamp("created_at").defaultNow(),
    updated_at: timestamp("updated_at").defaultNow(),
});