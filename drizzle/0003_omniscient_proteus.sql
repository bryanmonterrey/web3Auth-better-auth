CREATE TABLE "encrypted_wallets" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"address" text NOT NULL,
	"encrypted_privkey" text NOT NULL,
	"iv" text NOT NULL,
	"salt" text NOT NULL,
	"passkey_credential_id" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "encrypted_wallets_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "encrypted_wallets_address_unique" UNIQUE("address")
);
--> statement-breakpoint
ALTER TABLE "encrypted_wallets" ADD CONSTRAINT "encrypted_wallets_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;