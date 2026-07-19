ALTER TABLE `orders` ADD `business_name` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `business_type` text DEFAULT 'کافه' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `area` text DEFAULT '' NOT NULL;--> statement-breakpoint
UPDATE `products` SET `stock_qty` = MAX(`stock_qty`, 200);
