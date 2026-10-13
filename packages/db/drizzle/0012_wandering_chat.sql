ALTER TABLE "inbox_rules" DROP CONSTRAINT "inbox_rules_actions_required_check";--> statement-breakpoint
ALTER TABLE "inbox_rules" ADD COLUMN "workspace_id" uuid;--> statement-breakpoint
ALTER TABLE "inbox_rules" ADD COLUMN "account_id" uuid;--> statement-breakpoint
ALTER TABLE "inbox_rules" ADD CONSTRAINT "inbox_rules_workspace_user_fk" FOREIGN KEY ("workspace_id","user_id") REFERENCES "public"."workspaces"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inbox_rules" ADD CONSTRAINT "inbox_rules_account_user_fk" FOREIGN KEY ("account_id","user_id") REFERENCES "public"."financial_accounts"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inbox_rules" ADD CONSTRAINT "inbox_rules_actions_required_check" CHECK ("inbox_rules"."category_id" is not null or "inbox_rules"."person_id" is not null or "inbox_rules"."workspace_id" is not null or "inbox_rules"."account_id" is not null);