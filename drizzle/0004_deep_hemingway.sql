CREATE TABLE "wallet_access_log" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"action" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"success" boolean DEFAULT true NOT NULL,
	"error_message" text,
	"metadata" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "encrypted_wallets" ADD COLUMN "encrypted_mnemonic" text;--> statement-breakpoint
ALTER TABLE "encrypted_wallets" ADD COLUMN "mnemonic_iv" text;--> statement-breakpoint
ALTER TABLE "wallet_access_log" ADD CONSTRAINT "wallet_access_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;