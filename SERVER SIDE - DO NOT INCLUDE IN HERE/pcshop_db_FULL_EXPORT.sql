-- Exported database `pcshop_db` on 12/19/2025 7:29:19 PM (SQL exporter system by ThatSinclair)

CREATE TABLE `audit_logs` (
  `log_id` int NOT NULL AUTO_INCREMENT,
  `time_stamp` datetime DEFAULT CURRENT_TIMESTAMP,
  `user` varchar(100) NOT NULL,
  `change_made` text NOT NULL,
  `category` enum('Add','Edit','Delete') NOT NULL,
  `change_in` varchar(100) NOT NULL,
  PRIMARY KEY (`log_id`),
  KEY `idx_user` (`user`),
  KEY `idx_category` (`category`),
  KEY `idx_change_in` (`change_in`),
  KEY `idx_time_stamp` (`time_stamp`)
) ENGINE=InnoDB AUTO_INCREMENT=82 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `audit_logs` VALUES (1, '12/16/2025 4:24:43 AM', 'admin', 'Created new user: testuser', 'Add', 'User Management');
INSERT INTO `audit_logs` VALUES (2, '12/16/2025 4:24:43 AM', 'admin', 'Updated product: Gaming PC Pro', 'Edit', 'Products');
INSERT INTO `audit_logs` VALUES (3, '12/16/2025 4:24:43 AM', 'admin', 'Deleted category: Old Category', 'Delete', 'Categories');
INSERT INTO `audit_logs` VALUES (4, '12/16/2025 5:10:13 AM', 'ThatSinclair420', 'Updated user: ThatSinclairALT', 'Edit', 'User Management');
INSERT INTO `audit_logs` VALUES (5, '12/16/2025 6:30:50 PM', 'ThatSinclair420', 'Created new product: War Machine v3 (ID: 7)', 'Add', 'Products');
INSERT INTO `audit_logs` VALUES (6, '12/16/2025 6:32:10 PM', 'ThatSinclair420', 'Deleted product ID: 1', 'Delete', 'Products');
INSERT INTO `audit_logs` VALUES (7, '12/16/2025 6:37:20 PM', 'ThatSinclair420', 'Created new product: Tranquility v2 (ID: 8)', 'Add', 'Products');
INSERT INTO `audit_logs` VALUES (8, '12/16/2025 6:48:23 PM', 'ThatSinclair420', 'Updated PC part: Storage - SSD: 1TB', 'Edit', 'PC Parts');
INSERT INTO `audit_logs` VALUES (9, '12/16/2025 6:51:49 PM', 'ThatSinclair420', 'Updated product: War Machine v3 (ID: 7)', 'Edit', 'Products');
INSERT INTO `audit_logs` VALUES (10, '12/16/2025 6:52:31 PM', 'ThatSinclair420', 'Updated product: War Machine v3 (ID: 7)', 'Edit', 'Products');
INSERT INTO `audit_logs` VALUES (11, '12/16/2025 6:52:49 PM', 'ThatSinclair420', 'Deleted PC part ID: 4', 'Delete', 'PC Parts');
INSERT INTO `audit_logs` VALUES (12, '12/16/2025 7:02:52 PM', 'ThatSinclair420', 'Updated product: War Machine v3 (ID: 7)', 'Edit', 'Products');
INSERT INTO `audit_logs` VALUES (13, '12/16/2025 7:03:12 PM', 'ThatSinclair420', 'Updated product: Tranquility v2 (ID: 8)', 'Edit', 'Products');
INSERT INTO `audit_logs` VALUES (14, '12/18/2025 2:15:31 AM', 'ThatSinclair420', 'Updated gallery image: Item 3', 'Edit', 'Gallery');
INSERT INTO `audit_logs` VALUES (15, '12/18/2025 2:16:09 AM', 'ThatSinclair420', 'Updated gallery image: Item 3', 'Edit', 'Gallery');
INSERT INTO `audit_logs` VALUES (16, '12/18/2025 2:28:28 AM', 'ThatSinclair420', 'Deleted gallery image ID: 23', 'Delete', 'Gallery');
INSERT INTO `audit_logs` VALUES (17, '12/18/2025 2:28:36 AM', 'ThatSinclair420', 'Deleted gallery image ID: 24', 'Delete', 'Gallery');
INSERT INTO `audit_logs` VALUES (18, '12/18/2025 2:28:44 AM', 'ThatSinclair420', 'Updated gallery image: Item 3', 'Edit', 'Gallery');
INSERT INTO `audit_logs` VALUES (19, '12/18/2025 2:28:59 AM', 'ThatSinclair420', 'Updated gallery image: Item 3', 'Edit', 'Gallery');
INSERT INTO `audit_logs` VALUES (20, '12/18/2025 2:29:22 AM', 'ThatSinclair420', 'Updated gallery image: Item 8', 'Edit', 'Gallery');
INSERT INTO `audit_logs` VALUES (21, '12/18/2025 2:29:53 AM', 'ThatSinclair420', 'Updated gallery image: Item 8', 'Edit', 'Gallery');
INSERT INTO `audit_logs` VALUES (22, '12/18/2025 2:30:22 AM', 'ThatSinclair420', 'Updated gallery image: Item 7', 'Edit', 'Gallery');
INSERT INTO `audit_logs` VALUES (23, '12/18/2025 2:30:41 AM', 'ThatSinclair420', 'Updated gallery image: Item 7', 'Edit', 'Gallery');
INSERT INTO `audit_logs` VALUES (24, '12/18/2025 2:30:59 AM', 'ThatSinclair420', 'Updated gallery image: Item 7', 'Edit', 'Gallery');
INSERT INTO `audit_logs` VALUES (25, '12/18/2025 2:36:18 AM', 'ThatSinclair420', 'Updated product: PLACEHOLDER ✧ (ID: 6)', 'Edit', 'Products');
INSERT INTO `audit_logs` VALUES (26, '12/18/2025 2:51:06 AM', 'ThatSinclair420', 'Updated order #9 status to: delivered', 'Edit', 'Orders');
INSERT INTO `audit_logs` VALUES (27, '12/18/2025 2:56:02 AM', 'ThatSinclair420', 'Reset password for user: ThatSinclairALT (ID: 10)', 'Edit', 'User Management');
INSERT INTO `audit_logs` VALUES (28, '12/18/2025 2:59:00 AM', 'ThatSinclair420', 'Reset password for user: ThatSinclairALT (ID: 10)', 'Edit', 'User Management');
INSERT INTO `audit_logs` VALUES (29, '12/18/2025 3:02:28 AM', 'ThatSinclair420', 'Reset password for user: ThatSinclairALT (ID: 10)', 'Edit', 'User Management');
INSERT INTO `audit_logs` VALUES (30, '12/18/2025 3:05:41 AM', 'ThatSinclair420', 'Reset password for user: ThatSinclairALT (ID: 10)', 'Edit', 'User Management');
INSERT INTO `audit_logs` VALUES (31, '12/18/2025 4:12:10 PM', 'ThatSinclair420', 'Updated product: ULTIMATE PLACEHOLDER✧ (ID: 3)', 'Edit', 'Products');
INSERT INTO `audit_logs` VALUES (32, '12/18/2025 4:17:41 PM', 'ThatSinclair420', 'Updated product: ULTIMATE PLACEHOLDER✧ (ID: 3)', 'Edit', 'Products');
INSERT INTO `audit_logs` VALUES (33, '12/18/2025 4:22:20 PM', 'ThatSinclair420', 'Updated product: ULTIMATE PLACEHOLDER✧ (ID: 3)', 'Edit', 'Products');
INSERT INTO `audit_logs` VALUES (34, '12/18/2025 4:22:31 PM', 'ThatSinclair420', 'Updated product: ULTIMATE PLACEHOLDER✧ (ID: 3)', 'Edit', 'Products');
INSERT INTO `audit_logs` VALUES (35, '12/18/2025 4:27:26 PM', 'ThatSinclair420', 'Updated product: ULTIMATE PLACEHOLDER✧ (ID: 3)', 'Edit', 'Products');
INSERT INTO `audit_logs` VALUES (36, '12/18/2025 4:51:05 PM', 'ThatSinclair420', 'Deleted 1 order(s): 9', 'Delete', 'Orders Management');
INSERT INTO `audit_logs` VALUES (37, '12/18/2025 4:51:11 PM', 'ThatSinclair420', 'Updated order #11 status to: delivered', 'Edit', 'Orders');
INSERT INTO `audit_logs` VALUES (38, '12/18/2025 5:36:11 PM', 'ThatSinclair420', 'Updated product: Tranquility v2 (ID: 8)', 'Edit', 'Products');
INSERT INTO `audit_logs` VALUES (39, '12/18/2025 5:36:27 PM', 'ThatSinclair420', 'Updated product: War Machine v3 (ID: 7)', 'Edit', 'Products');
INSERT INTO `audit_logs` VALUES (40, '12/18/2025 5:36:43 PM', 'ThatSinclair420', 'Updated product: PLACEHOLDER ✧ (ID: 6)', 'Edit', 'Products');
INSERT INTO `audit_logs` VALUES (41, '12/18/2025 5:36:54 PM', 'ThatSinclair420', 'Updated product: ULTIMATE PLACEHOLDER✧ (ID: 3)', 'Edit', 'Products');
INSERT INTO `audit_logs` VALUES (42, '12/19/2025 12:16:59 PM', 'ThatSinclair420', 'Updated product: PLACEHOLDER ✧ (ID: 6)', 'Edit', 'Products');
INSERT INTO `audit_logs` VALUES (43, '12/19/2025 12:22:44 PM', 'ThatSinclair420', 'Updated product: PLACEHOLDER ✧ (ID: 6)', 'Edit', 'Products');
INSERT INTO `audit_logs` VALUES (44, '12/19/2025 12:22:54 PM', 'ThatSinclair420', 'Updated product: PLACEHOLDER ✧ (ID: 6)', 'Edit', 'Products');
INSERT INTO `audit_logs` VALUES (45, '12/19/2025 12:31:13 PM', 'ThatSinclair420', 'Deleted product ID: 6', 'Delete', 'Products');
INSERT INTO `audit_logs` VALUES (46, '12/19/2025 12:31:58 PM', 'ThatSinclair420', 'Updated product: ULTIMATE PLACEHOLDER✧ (ID: 3)', 'Edit', 'Products');
INSERT INTO `audit_logs` VALUES (47, '12/19/2025 12:32:12 PM', 'ThatSinclair420', 'Updated product: ULTIMATE PLACEHOLDER✧ (ID: 3)', 'Edit', 'Products');
INSERT INTO `audit_logs` VALUES (48, '12/19/2025 12:33:26 PM', 'ThatSinclair420', 'Updated product: ULTIMATE PLACEHOLDER✧ (ID: 3)', 'Edit', 'Products');
INSERT INTO `audit_logs` VALUES (49, '12/19/2025 12:35:07 PM', 'ThatSinclair420', 'Updated product: ULTIMATE PLACEHOLDER✧ (ID: 3)', 'Edit', 'Products');
INSERT INTO `audit_logs` VALUES (50, '12/19/2025 12:35:59 PM', 'ThatSinclair420', 'Updated product: ULTIMATE PLACEHOLDER✧ (ID: 3)', 'Edit', 'Products');
INSERT INTO `audit_logs` VALUES (51, '12/19/2025 12:36:45 PM', 'ThatSinclair420', 'Updated product: Shadows Strike v3 (ID: 3)', 'Edit', 'Products');
INSERT INTO `audit_logs` VALUES (52, '12/19/2025 1:15:19 PM', 'ThatSinclair420', 'Deleted 4 order(s): 14, 13, 12, 11', 'Delete', 'Orders Management');
INSERT INTO `audit_logs` VALUES (53, '12/19/2025 2:32:30 PM', 'ThatSinclair420', 'Updated product: Shadows Strike v3 (ID: 3)', 'Edit', 'Products');
INSERT INTO `audit_logs` VALUES (54, '12/19/2025 2:37:35 PM', 'ThatSinclair420', 'Updated product: Shadows Strike v3 (ID: 3)', 'Edit', 'Products');
INSERT INTO `audit_logs` VALUES (55, '12/19/2025 2:37:43 PM', 'ThatSinclair420', 'Updated product: Shadows Strike v3 (ID: 3)', 'Edit', 'Products');
INSERT INTO `audit_logs` VALUES (56, '12/19/2025 2:38:10 PM', 'ThatSinclair420', 'Deleted 1 order(s): 15', 'Delete', 'Orders Management');
INSERT INTO `audit_logs` VALUES (57, '12/19/2025 2:44:48 PM', 'ThatSinclair420', 'Updated product: Tranquility v2 (ID: 8)', 'Edit', 'Products');
INSERT INTO `audit_logs` VALUES (58, '12/19/2025 2:44:53 PM', 'ThatSinclair420', 'Updated product: War Machine v3 (ID: 7)', 'Edit', 'Products');
INSERT INTO `audit_logs` VALUES (59, '12/19/2025 2:44:56 PM', 'ThatSinclair420', 'Updated product: Shadows Strike v3 (ID: 3)', 'Edit', 'Products');
INSERT INTO `audit_logs` VALUES (60, '12/19/2025 2:44:58 PM', 'ThatSinclair420', 'Updated product: Shadows Strike v3 (ID: 3)', 'Edit', 'Products');
INSERT INTO `audit_logs` VALUES (61, '12/19/2025 2:47:51 PM', 'ThatSinclair420', 'Updated product: Tranquility v2 (ID: 8)', 'Edit', 'Products');
INSERT INTO `audit_logs` VALUES (62, '12/19/2025 2:47:56 PM', 'ThatSinclair420', 'Updated product: Tranquility v2 (ID: 8)', 'Edit', 'Products');
INSERT INTO `audit_logs` VALUES (63, '12/19/2025 2:48:04 PM', 'ThatSinclair420', 'Updated product: Tranquility v2 (ID: 8)', 'Edit', 'Products');
INSERT INTO `audit_logs` VALUES (64, '12/19/2025 2:48:09 PM', 'ThatSinclair420', 'Updated product: Tranquility v2 (ID: 8)', 'Edit', 'Products');
INSERT INTO `audit_logs` VALUES (65, '12/19/2025 2:48:15 PM', 'ThatSinclair420', 'Updated product: Tranquility v2 (ID: 8)', 'Edit', 'Products');
INSERT INTO `audit_logs` VALUES (66, '12/19/2025 2:48:48 PM', 'ThatSinclair420', 'Created new product: placeholder (ID: 9)', 'Add', 'Products');
INSERT INTO `audit_logs` VALUES (67, '12/19/2025 2:48:51 PM', 'ThatSinclair420', 'Deleted product ID: 9', 'Delete', 'Products');
INSERT INTO `audit_logs` VALUES (68, '12/19/2025 2:52:15 PM', 'ThatSinclair420', 'Updated product: Tranquility v2 (ID: 8)', 'Edit', 'Products');
INSERT INTO `audit_logs` VALUES (69, '12/19/2025 2:52:23 PM', 'ThatSinclair420', 'Updated product: Tranquility v2 (ID: 8)', 'Edit', 'Products');
INSERT INTO `audit_logs` VALUES (70, '12/19/2025 2:52:29 PM', 'ThatSinclair420', 'Updated product: Tranquility v2 (ID: 8)', 'Edit', 'Products');
INSERT INTO `audit_logs` VALUES (71, '12/19/2025 2:52:49 PM', 'ThatSinclair420', 'Updated product: Shadows Strike v3 (ID: 3)', 'Edit', 'Products');
INSERT INTO `audit_logs` VALUES (72, '12/19/2025 2:56:26 PM', 'ThatSinclair420', 'Updated product: Shadows Strike v3 (ID: 3)', 'Edit', 'Products');
INSERT INTO `audit_logs` VALUES (73, '12/19/2025 3:16:15 PM', 'ThatSinclair420', 'Updated order #16 status to: delivered', 'Edit', 'Orders');
INSERT INTO `audit_logs` VALUES (74, '12/19/2025 3:16:50 PM', 'ThatSinclair420', 'Deleted 1 order(s): 16', 'Delete', 'Orders Management');
INSERT INTO `audit_logs` VALUES (75, '12/19/2025 3:22:32 PM', 'ThatSinclair420', 'Updated product: Shadows Strike v3 (ID: 3)', 'Edit', 'Products');
INSERT INTO `audit_logs` VALUES (76, '12/19/2025 3:22:45 PM', 'ThatSinclair420', 'Updated product: Shadows Strike v3 (ID: 3)', 'Edit', 'Products');
INSERT INTO `audit_logs` VALUES (77, '12/19/2025 4:47:27 PM', 'ThatSinclair420', 'Created new product: PLACEHOLDER ✧ (ID: 10)', 'Add', 'Products');
INSERT INTO `audit_logs` VALUES (78, '12/19/2025 6:05:35 PM', 'ThatSinclair420', 'Updated order #18 status to: shipped', 'Edit', 'Orders');
INSERT INTO `audit_logs` VALUES (79, '12/19/2025 6:06:01 PM', 'ThatSinclair420', 'Deleted product ID: 10', 'Delete', 'Products');
INSERT INTO `audit_logs` VALUES (80, '12/19/2025 6:06:51 PM', 'ThatSinclair420', 'Updated product: Shadows Strike v3 (ID: 3)', 'Edit', 'Products');
INSERT INTO `audit_logs` VALUES (81, '12/19/2025 6:08:23 PM', 'ThatSinclair420', 'Deleted user: debug_1766007237350 (ID: 11)', 'Delete', 'User Management');

CREATE TABLE `cart` (
  `cart_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`cart_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `cart_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `cart` VALUES (1, 6, '12/16/2025 5:08:37 PM');
INSERT INTO `cart` VALUES (2, 7, '12/16/2025 6:31:25 PM');
INSERT INTO `cart` VALUES (3, 12, '12/19/2025 4:54:05 PM');
INSERT INTO `cart` VALUES (4, 13, '12/19/2025 6:02:54 PM');

CREATE TABLE `cart_items` (
  `cart_item_id` int NOT NULL AUTO_INCREMENT,
  `cart_id` int NOT NULL,
  `item_id` int NOT NULL,
  `quantity` int DEFAULT '1',
  PRIMARY KEY (`cart_item_id`),
  KEY `cart_id` (`cart_id`),
  KEY `item_id` (`item_id`),
  CONSTRAINT `cart_items_ibfk_1` FOREIGN KEY (`cart_id`) REFERENCES `cart` (`cart_id`) ON DELETE CASCADE,
  CONSTRAINT `cart_items_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `items` (`item_id`)
) ENGINE=InnoDB AUTO_INCREMENT=63 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `cart_items` VALUES (52, 1, 7, 1);
INSERT INTO `cart_items` VALUES (60, 2, 3, 1);
INSERT INTO `cart_items` VALUES (62, 4, 7, 1);

CREATE TABLE `categories` (
  `category_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  PRIMARY KEY (`category_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `categories` VALUES (1, 'Gaming PC', 'High-performance prebuilt gaming desktops for enthusiasts');
INSERT INTO `categories` VALUES (2, 'Office PC', 'NOT high-performance prebuilt desktops NOT for enthusiasts');

CREATE TABLE `item_images` (
  `image_id` int NOT NULL AUTO_INCREMENT,
  `item_id` int NOT NULL,
  `url` varchar(1024) NOT NULL,
  `alt_text` varchar(255) DEFAULT NULL,
  `sort_order` int DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`image_id`),
  KEY `item_id` (`item_id`),
  CONSTRAINT `item_images_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `items` (`item_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=117 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `item_images` VALUES (85, 7, 'https://i.ibb.co/YMnmcw2/War-Machine-v3.webp', 'War Machine v3', 0, '12/19/2025 2:44:52 PM');
INSERT INTO `item_images` VALUES (86, 7, 'https://i.ibb.co/hFLgpFwx/side-War-Machine-v3.webp', 'War Machine v3', 1, '12/19/2025 2:44:52 PM');
INSERT INTO `item_images` VALUES (105, 8, 'https://i.ibb.co/93qCTgQp/Tranquility-v2.webp', 'Tranquility v2', 0, '12/19/2025 2:52:27 PM');
INSERT INTO `item_images` VALUES (106, 8, 'https://i.ibb.co/Wvp4mRKM/side-Tranquility-v2.webp', 'Tranquility v2', 1, '12/19/2025 2:52:27 PM');
INSERT INTO `item_images` VALUES (115, 3, 'https://i.ibb.co/SXnScFZD/Shadow-Strike-v3.webp', 'Shadows Strike v3', 0, '12/19/2025 6:06:50 PM');
INSERT INTO `item_images` VALUES (116, 3, 'https://i.ibb.co/hFLgpFwx/side-War-Machine-v3.webp', 'Shadows Strike v3', 1, '12/19/2025 6:06:50 PM');

CREATE TABLE `item_specs` (
  `item_spec_id` int NOT NULL AUTO_INCREMENT,
  `item_id` int NOT NULL,
  `spec_id` int NOT NULL,
  PRIMARY KEY (`item_spec_id`),
  UNIQUE KEY `unique_item_spec` (`item_id`,`spec_id`),
  KEY `item_id` (`item_id`),
  KEY `spec_id` (`spec_id`),
  CONSTRAINT `item_specs_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `items` (`item_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=239 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `item_specs` VALUES (238, 3, 11);
INSERT INTO `item_specs` VALUES (234, 3, 29);
INSERT INTO `item_specs` VALUES (235, 3, 30);
INSERT INTO `item_specs` VALUES (236, 3, 32);
INSERT INTO `item_specs` VALUES (237, 3, 33);
INSERT INTO `item_specs` VALUES (154, 7, 9);
INSERT INTO `item_specs` VALUES (155, 7, 10);
INSERT INTO `item_specs` VALUES (158, 7, 11);
INSERT INTO `item_specs` VALUES (156, 7, 12);
INSERT INTO `item_specs` VALUES (157, 7, 13);
INSERT INTO `item_specs` VALUES (153, 7, 14);
INSERT INTO `item_specs` VALUES (152, 7, 23);
INSERT INTO `item_specs` VALUES (159, 7, 24);
INSERT INTO `item_specs` VALUES (218, 8, 9);
INSERT INTO `item_specs` VALUES (219, 8, 16);
INSERT INTO `item_specs` VALUES (222, 8, 17);
INSERT INTO `item_specs` VALUES (223, 8, 18);
INSERT INTO `item_specs` VALUES (220, 8, 19);
INSERT INTO `item_specs` VALUES (221, 8, 20);
INSERT INTO `item_specs` VALUES (217, 8, 21);
INSERT INTO `item_specs` VALUES (216, 8, 22);

CREATE TABLE `items` (
  `item_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text,
  `price` decimal(25,2) NOT NULL,
  `stock` int DEFAULT '0',
  `category_id` int DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`item_id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `items_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `items` VALUES (3, 'Shadows Strike v3', '', 15000.00, 2, 1, 'https://i.ibb.co/4gF7T653/PLACEHOLDER-2.png', '12/15/2025 10:52:35 PM', '12/19/2025 2:56:24 PM');
INSERT INTO `items` VALUES (7, 'War Machine v3', '', 40800000.00, 6, 1, 'https://i.ibb.co/YMnmcw2/War-Machine-v3.webp', '12/16/2025 6:30:48 PM', '12/19/2025 2:44:52 PM');
INSERT INTO `items` VALUES (8, 'Tranquility v2', '', 48800000.00, 5, 1, 'https://i.ibb.co/93qCTgQp/Tranquility-v2.webp', '12/16/2025 6:37:19 PM', '12/19/2025 2:52:27 PM');

CREATE TABLE `order_items` (
  `order_item_id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `item_id` int NOT NULL,
  `quantity` int DEFAULT '1',
  `price_each` decimal(25,2) NOT NULL,
  PRIMARY KEY (`order_item_id`),
  KEY `order_id` (`order_id`),
  KEY `item_id` (`item_id`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `items` (`item_id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `order_items` VALUES (15, 17, 7, 1, 40800000.00);
INSERT INTO `order_items` VALUES (16, 18, 7, 1, 40800000.00);

CREATE TABLE `orders` (
  `order_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `total_amount` decimal(25,2) NOT NULL,
  `order_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `status` enum('pending','shipped','delivered','cancelled') DEFAULT 'pending',
  `shipping_name` varchar(255) DEFAULT NULL,
  `shipping_address` varchar(500) DEFAULT NULL,
  `shipping_city` varchar(255) DEFAULT NULL,
  `shipping_province` varchar(255) DEFAULT NULL,
  `shipping_postal` varchar(50) DEFAULT NULL,
  `shipping_phone` varchar(50) DEFAULT NULL,
  `payment_method` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`order_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `orders` VALUES (17, 12, 40800000.00, '12/19/2025 4:55:34 PM', 'pending', 'Burning Burner', 'My house', NULL, 'Thừa Thiên Huế', NULL, '01234467514', 'bank');
INSERT INTO `orders` VALUES (18, 13, 40800000.00, '12/19/2025 6:04:14 PM', 'shipped', 'Hoang Anh', 'My home', 'Debug City', 'Hải Dương', '00000', '0123456789', 'momo');

CREATE TABLE `pc_specs` (
  `spec_id` int NOT NULL AUTO_INCREMENT,
  `section` varchar(100) DEFAULT NULL,
  `spec_key` varchar(200) NOT NULL,
  `spec_value` text NOT NULL,
  `display_order` int DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`spec_id`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `pc_specs` VALUES (1, 'CPU', 'Processor', 'Intel Core i7-10700K', 0, '12/15/2025 10:52:35 PM', '12/15/2025 10:52:35 PM');
INSERT INTO `pc_specs` VALUES (2, 'GPU', 'Discrete', 'RTX 4070', 1, '12/15/2025 10:52:35 PM', '12/15/2025 10:52:35 PM');
INSERT INTO `pc_specs` VALUES (3, 'RAM', 'DDR4', '32GB (2x16GB)', 2, '12/15/2025 10:52:35 PM', '12/15/2025 10:52:35 PM');
INSERT INTO `pc_specs` VALUES (9, 'CPU', 'Processor', 'Ryzen 5 9600X', 0, '12/16/2025 6:30:48 PM', '12/16/2025 6:30:48 PM');
INSERT INTO `pc_specs` VALUES (10, 'GPU', 'Discrete', 'XFX Swift RX 9060 XT 16GB', 2, '12/16/2025 6:30:48 PM', '12/16/2025 6:30:48 PM');
INSERT INTO `pc_specs` VALUES (11, 'RAM', 'DDR5', 'G.Skill Flare X5 32GB 6000MHz', 3, '12/16/2025 6:30:48 PM', '12/16/2025 6:30:48 PM');
INSERT INTO `pc_specs` VALUES (12, 'Motherboard', 'Mobo', 'MSI Pro B650-S WiFi', 4, '12/16/2025 6:30:48 PM', '12/16/2025 6:30:48 PM');
INSERT INTO `pc_specs` VALUES (13, 'PSU', 'Power Supply', 'MSI MAG A750BE 750W 80+ Bronze', 5, '12/16/2025 6:30:48 PM', '12/16/2025 6:30:48 PM');
INSERT INTO `pc_specs` VALUES (14, 'Cooling', 'Air Cooling', ' ID Cooling Frozn A410', 6, '12/16/2025 6:30:48 PM', '12/16/2025 6:30:48 PM');
INSERT INTO `pc_specs` VALUES (15, 'Case', 'Case', 'CORSAIR 4000D RS Frame Black (19.1"x9.4"x19.3")', 7, '12/16/2025 6:30:48 PM', '12/16/2025 6:30:48 PM');
INSERT INTO `pc_specs` VALUES (16, 'GPU', 'Discrete', 'Yeston Sakura RX 9070', 1, '12/16/2025 6:37:19 PM', '12/16/2025 6:37:19 PM');
INSERT INTO `pc_specs` VALUES (17, 'RAM', 'DDR5', 'Team T-Force Delta R RGB White DDR5 32GB 6000MHz', 2, '12/16/2025 6:37:19 PM', '12/16/2025 6:37:19 PM');
INSERT INTO `pc_specs` VALUES (18, 'Storage', 'SSD', 'Silicon Power UD90 Gen 4 2TB NVMe', 3, '12/16/2025 6:37:19 PM', '12/16/2025 6:37:19 PM');
INSERT INTO `pc_specs` VALUES (19, 'Motherboard', 'Mobo', 'ASUS B650E MAX Gaming WiFi', 4, '12/16/2025 6:37:19 PM', '12/16/2025 6:37:19 PM');
INSERT INTO `pc_specs` VALUES (20, 'PSU', 'Power Supply', 'darkFlash PMT850', 5, '12/16/2025 6:37:19 PM', '12/16/2025 6:37:19 PM');
INSERT INTO `pc_specs` VALUES (21, 'Cooling', 'Air Cooling', 'Thermalright Aqua Elite 360 v4 ARGB 360mm White', 6, '12/16/2025 6:37:19 PM', '12/16/2025 6:37:19 PM');
INSERT INTO `pc_specs` VALUES (22, 'Case', 'Extension', 'Sirlyr White/Blue Extensions', 7, '12/16/2025 6:37:19 PM', '12/16/2025 6:37:19 PM');
INSERT INTO `pc_specs` VALUES (23, 'Case', 'Case', 'CORSAIR 4000D RS Frame Black (19.1', 0, '12/16/2025 6:51:47 PM', '12/16/2025 6:51:47 PM');
INSERT INTO `pc_specs` VALUES (24, 'Storage', 'SSD', 'Teamgroup MP44L Gen 4 1TB NVMe', 7, '12/16/2025 6:52:30 PM', '12/16/2025 6:52:30 PM');
INSERT INTO `pc_specs` VALUES (25, 'CPU', 'Processor', 'Intel Pentium 4 HT 3.2E', 0, '12/18/2025 4:27:24 PM', '12/18/2025 4:27:24 PM');
INSERT INTO `pc_specs` VALUES (26, 'GPU', 'Discrete', 'Nvidia GeForce GT 1030 DDR4', 1, '12/18/2025 4:27:24 PM', '12/18/2025 4:27:24 PM');
INSERT INTO `pc_specs` VALUES (27, 'RAM', 'DDR1', '8MB RAM', 2, '12/18/2025 4:27:24 PM', '12/18/2025 4:27:24 PM');
INSERT INTO `pc_specs` VALUES (28, 'Storage', 'HDD', 'Seagate''s Barracuda 7200.11 series 1TB', 3, '12/18/2025 4:27:24 PM', '12/18/2025 4:27:24 PM');
INSERT INTO `pc_specs` VALUES (29, 'CPU', 'Processor', 'Ryzen 7 9700X', 0, '12/19/2025 3:22:31 PM', '12/19/2025 3:22:31 PM');
INSERT INTO `pc_specs` VALUES (30, 'GPU', 'Discrete', 'Gigabyte Eagle RTX 5070*', 1, '12/19/2025 3:22:31 PM', '12/19/2025 3:22:31 PM');
INSERT INTO `pc_specs` VALUES (31, 'RAM', 'DDR5', 'G.Skill Flare X5 DDR5 32GB 6000 MHz', 2, '12/19/2025 3:22:31 PM', '12/19/2025 3:22:31 PM');
INSERT INTO `pc_specs` VALUES (32, 'Motherboard', 'Mobo', 'Gigabyte X670 AORUS Elite AX*', 4, '12/19/2025 3:22:31 PM', '12/19/2025 3:22:31 PM');
INSERT INTO `pc_specs` VALUES (33, 'PSU', 'Power Supply', 'Cooler Master MWE Gold 750 V3 80+ Gold', 5, '12/19/2025 3:22:31 PM', '12/19/2025 3:22:31 PM');

CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('user','admin') DEFAULT 'user',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `users` VALUES (6, 'BadKuro6', 'minamikatsuro@gmail.com', '$2b$10$Tl2/MJi2NG3p1kgSB7TxXupLQB7ceIHyop87GDVutjrzyqGUkBwRW', 'user', '12/4/2025 2:23:50 PM', '12/4/2025 2:23:50 PM');
INSERT INTO `users` VALUES (7, 'ThatSinclair420', 'thatsinclair63@outlook.com', '$2b$10$koACLW8Uj2qWRb.2x.PHZuAZhcnPwPMzSlkHK6wFA.Ugd/Ij/TKwW', 'admin', '12/4/2025 4:03:18 PM', '12/16/2025 4:10:24 AM');
INSERT INTO `users` VALUES (8, 'TranTien', '12345@gmail.com', '$2b$10$wCFhpl5JscSrB.im/ud.tebuGVGiv5Z8/h69DKc.B2Ifoc/LbPnoW', 'user', '12/5/2025 3:24:12 PM', '12/5/2025 3:24:12 PM');
INSERT INTO `users` VALUES (10, 'ThatSinclairALT', '6320contact@gmail.com', '$2b$10$Hte3V7I9OPCDnT2rJiXLBucyY5wKttV1Gz.T5QEm6I1IB0cYKhYsW', 'user', '12/16/2025 5:04:00 AM', '12/18/2025 3:05:38 AM');
INSERT INTO `users` VALUES (12, 'FireRisker', 'firerisky123@gmail.com', '$2b$10$aedZ8vZbKDFjszaywHxhKuaU1WwLQ3gwE3SiApDfWc8/Th8mwapxe', 'user', '12/19/2025 4:52:52 PM', '12/19/2025 4:52:52 PM');
INSERT INTO `users` VALUES (13, 'hoanganh', 'hoanganh2345h@gmail.com', '$2b$10$bWF8gU251QJY7sXqmuP.sepl/zjBLKsiMqvfsOjT.y4XTcBty6o6G', 'user', '12/19/2025 6:02:04 PM', '12/19/2025 6:02:04 PM');

