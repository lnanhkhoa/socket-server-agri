DROP TRIGGER IF EXISTS `loyalty`.`config_updated_at`;
DELIMITER $$
USE `loyalty`$$
CREATE DEFINER=`admin`@` % ` TRIGGER `config_updated_at` BEFORE UPDATE ON `config`
FOR EACH ROW BEGIN
SET NEW.updated_at = CURRENT_TIMESTAMP;
END;$$
DELIMITER ;


DROP TRIGGER IF EXISTS `loyalty`.`benefit_updated_at`;
DELIMITER $$
USE `loyalty`$$
CREATE DEFINER=`admin`@` % ` TRIGGER `benefit_updated_at` BEFORE UPDATE ON `benefit`
FOR EACH ROW BEGIN
SET NEW.updated_at = CURRENT_TIMESTAMP;
END;$$
DELIMITER ;


DROP TRIGGER IF EXISTS `loyalty`.`bill_product_updated_at`;
DELIMITER $$
USE `loyalty`$$
CREATE DEFINER=`admin`@` % ` TRIGGER `bill_product_updated_at` BEFORE UPDATE ON `bill_product`
FOR EACH ROW BEGIN
SET NEW.updated_at = CURRENT_TIMESTAMP;
END;$$
DELIMITER ;


DROP TRIGGER IF EXISTS `loyalty`.`bill_updated_at`;
DELIMITER $$
USE `loyalty`$$
CREATE DEFINER=`admin`@` % ` TRIGGER `bill_updated_at` BEFORE UPDATE ON `bill`
FOR EACH ROW BEGIN
SET NEW.updated_at = CURRENT_TIMESTAMP;
END;$$
DELIMITER ;


DROP TRIGGER IF EXISTS `loyalty`.`coupon_rule_coupon_updated_at`;
DELIMITER $$
USE `loyalty`$$
CREATE DEFINER=`admin`@` % ` TRIGGER `coupon_rule_coupon_updated_at` BEFORE UPDATE ON `coupon_rule_coupon`
FOR EACH ROW BEGIN
SET NEW.updated_at = CURRENT_TIMESTAMP;
END;$$
DELIMITER ;


DROP TRIGGER IF EXISTS `loyalty`.`coupon_rule_type_updated_at`;
DELIMITER $$
USE `loyalty`$$
CREATE DEFINER=`admin`@` % ` TRIGGER `coupon_rule_type_updated_at` BEFORE UPDATE ON `coupon_rule_type`
FOR EACH ROW BEGIN
SET NEW.updated_at = CURRENT_TIMESTAMP;
END;$$
DELIMITER ;


DROP TRIGGER IF EXISTS `loyalty`.`coupon_rule_updated_at`;
DELIMITER $$
USE `loyalty`$$
CREATE DEFINER=`admin`@` % ` TRIGGER `coupon_rule_updated_at` BEFORE UPDATE ON `coupon_rule`
FOR EACH ROW BEGIN
SET NEW.updated_at = CURRENT_TIMESTAMP;
END;$$
DELIMITER ;


DROP TRIGGER IF EXISTS `loyalty`.`coupon_type_updated_at`;
DELIMITER $$
USE `loyalty`$$
CREATE DEFINER=`admin`@` % ` TRIGGER `coupon_type_updated_at` BEFORE UPDATE ON `coupon_type`
FOR EACH ROW BEGIN
SET NEW.updated_at = CURRENT_TIMESTAMP;
END;$$
DELIMITER ;


DROP TRIGGER IF EXISTS `loyalty`.`coupon_updated_at`;
DELIMITER $$
USE `loyalty`$$
CREATE DEFINER=`admin`@` % ` TRIGGER `coupon_updated_at` BEFORE UPDATE ON `coupon`
FOR EACH ROW BEGIN
SET NEW.updated_at = CURRENT_TIMESTAMP;
END;$$
DELIMITER ;


DROP TRIGGER IF EXISTS `loyalty`.`coupon_content_updated_at`;
DELIMITER $$
USE `loyalty`$$
CREATE DEFINER=`admin`@` % ` TRIGGER `coupon_content_updated_at` BEFORE UPDATE ON `coupon_content`
FOR EACH ROW BEGIN
SET NEW.updated_at = CURRENT_TIMESTAMP;
END;$$
DELIMITER ;


DROP TRIGGER IF EXISTS `loyalty`.`customer_coupon_updated_at`;
DELIMITER $$
USE `loyalty`$$
CREATE DEFINER=`admin`@` % ` TRIGGER `customer_coupon_updated_at` BEFORE UPDATE ON `customer_coupon`
FOR EACH ROW BEGIN
SET NEW.updated_at = CURRENT_TIMESTAMP;
END;$$
DELIMITER ;


DROP TRIGGER IF EXISTS `loyalty`.`customer_detail_updated_at`;
DELIMITER $$
USE `loyalty`$$
CREATE DEFINER=`admin`@` % ` TRIGGER `customer_detail_updated_at` BEFORE UPDATE ON `customer_detail`
FOR EACH ROW BEGIN
SET NEW.updated_at = CURRENT_TIMESTAMP;
END;$$
DELIMITER ;


DROP TRIGGER IF EXISTS `loyalty`.`customer_updated_at`;
DELIMITER $$
USE `loyalty`$$
CREATE DEFINER=`admin`@` % ` TRIGGER `customer_updated_at` BEFORE UPDATE ON `customer`
FOR EACH ROW BEGIN
SET NEW.updated_at = CURRENT_TIMESTAMP;
END;$$
DELIMITER ;


DROP TRIGGER IF EXISTS `loyalty`.`location_type_updated_at`;
DELIMITER $$
USE `loyalty`$$
CREATE DEFINER=`admin`@` % ` TRIGGER `location_type_updated_at` BEFORE UPDATE ON `location_type`
FOR EACH ROW BEGIN
SET NEW.updated_at = CURRENT_TIMESTAMP;
END;$$
DELIMITER ;


DROP TRIGGER IF EXISTS `loyalty`.`location_updated_at`;
DELIMITER $$
USE `loyalty`$$
CREATE DEFINER=`admin`@` % ` TRIGGER `location_updated_at` BEFORE UPDATE ON `location`
FOR EACH ROW BEGIN
SET NEW.updated_at = CURRENT_TIMESTAMP;
END;$$
DELIMITER ;


DROP TRIGGER IF EXISTS `loyalty`.`member_card_type_benefit_updated_at`;
DELIMITER $$
USE `loyalty`$$
CREATE DEFINER=`admin`@` % ` TRIGGER `member_card_type_benefit_updated_at` BEFORE UPDATE ON `member_card_type_benefit`
FOR EACH ROW BEGIN
SET NEW.updated_at = CURRENT_TIMESTAMP;
END;$$
DELIMITER ;


DROP TRIGGER IF EXISTS `loyalty`.`member_card_type_updated_at`;
DELIMITER $$
USE `loyalty`$$
CREATE DEFINER=`admin`@` % ` TRIGGER `member_card_type_updated_at` BEFORE UPDATE ON `member_card_type`
FOR EACH ROW BEGIN
SET NEW.updated_at = CURRENT_TIMESTAMP;
END;$$
DELIMITER ;


DROP TRIGGER IF EXISTS `loyalty`.`member_card_updated_at`;
DELIMITER $$
USE `loyalty`$$
CREATE DEFINER=`admin`@` % ` TRIGGER `member_card_updated_at` BEFORE UPDATE ON `member_card`
FOR EACH ROW BEGIN
SET NEW.updated_at = CURRENT_TIMESTAMP;
END;$$
DELIMITER ;


DROP TRIGGER IF EXISTS `loyalty`.`news_tag_updated_at`;
DELIMITER $$
USE `loyalty`$$
CREATE DEFINER=`admin`@` % ` TRIGGER `news_tag_updated_at` BEFORE UPDATE ON `news_tag`
FOR EACH ROW BEGIN
SET NEW.updated_at = CURRENT_TIMESTAMP;
END;$$
DELIMITER ;


DROP TRIGGER IF EXISTS `loyalty`.`news_updated_at`;
DELIMITER $$
USE `loyalty`$$
CREATE DEFINER=`admin`@` % ` TRIGGER `news_updated_at` BEFORE UPDATE ON `news`
FOR EACH ROW BEGIN
SET NEW.updated_at = CURRENT_TIMESTAMP;
END;$$
DELIMITER ;


DROP TRIGGER IF EXISTS `loyalty`.`point_updated_at`;
DELIMITER $$
USE `loyalty`$$
CREATE DEFINER=`admin`@` % ` TRIGGER `point_updated_at` BEFORE UPDATE ON `point`
FOR EACH ROW BEGIN
SET NEW.updated_at = CURRENT_TIMESTAMP;
END;$$
DELIMITER ;


DROP TRIGGER IF EXISTS `loyalty`.`notification_updated_at`;
DELIMITER $$
USE `loyalty`$$
CREATE DEFINER=`admin`@` % ` TRIGGER `notification_updated_at` BEFORE UPDATE ON `notification`
FOR EACH ROW BEGIN
SET NEW.updated_at = CURRENT_TIMESTAMP;
END;$$
DELIMITER ;


DROP TRIGGER IF EXISTS `loyalty`.`notification_type_updated_at`;
DELIMITER $$
USE `loyalty`$$
CREATE DEFINER=`admin`@` % ` TRIGGER `notification_type_updated_at` BEFORE UPDATE ON `notification_type`
FOR EACH ROW BEGIN
SET NEW.updated_at = CURRENT_TIMESTAMP;
END;$$
DELIMITER ;


DROP TRIGGER IF EXISTS `loyalty`.`pos_updated_at`;
DELIMITER $$
USE `loyalty`$$
CREATE DEFINER=`admin`@` % ` TRIGGER `pos_updated_at` BEFORE UPDATE ON `pos`
FOR EACH ROW BEGIN
SET NEW.updated_at = CURRENT_TIMESTAMP;
END;$$
DELIMITER ;


DROP TRIGGER IF EXISTS `loyalty`.`product_updated_at`;
DELIMITER $$
USE `loyalty`$$
CREATE DEFINER=`admin`@` % ` TRIGGER `product_updated_at` BEFORE UPDATE ON `product`
FOR EACH ROW BEGIN
SET NEW.updated_at = CURRENT_TIMESTAMP;
END;$$
DELIMITER ;


DROP TRIGGER IF EXISTS `loyalty`.`promotion_type_updated_at`;
DELIMITER $$
USE `loyalty`$$
CREATE DEFINER=`admin`@` % ` TRIGGER `promotion_type_updated_at` BEFORE UPDATE ON `promotion_type`
FOR EACH ROW BEGIN
SET NEW.updated_at = CURRENT_TIMESTAMP;
END;$$
DELIMITER ;


DROP TRIGGER IF EXISTS `loyalty`.`promotion_updated_at`;
DELIMITER $$
USE `loyalty`$$
CREATE DEFINER=`admin`@` % ` TRIGGER `promotion_updated_at` BEFORE UPDATE ON `promotion`
FOR EACH ROW BEGIN
SET NEW.updated_at = CURRENT_TIMESTAMP;
END;$$
DELIMITER ;


DROP TRIGGER IF EXISTS `loyalty`.`tag_updated_at`;
DELIMITER $$
USE `loyalty`$$
CREATE DEFINER=`admin`@` % ` TRIGGER `tag_updated_at` BEFORE UPDATE ON `tag`
FOR EACH ROW BEGIN
SET NEW.updated_at = CURRENT_TIMESTAMP;
END;$$
DELIMITER ;


DROP TRIGGER IF EXISTS `loyalty`.`tokenkey_updated_at`;
DELIMITER $$
USE `loyalty`$$
CREATE DEFINER=`admin`@` % ` TRIGGER `tokenkey_updated_at` BEFORE UPDATE ON `tokenkey`
FOR EACH ROW BEGIN
SET NEW.updated_at = CURRENT_TIMESTAMP;
END;$$
DELIMITER ;


DROP TRIGGER IF EXISTS `loyalty`.`store_updated_at`;
DELIMITER $$
USE `loyalty`$$
CREATE DEFINER=`admin`@` % ` TRIGGER `store_updated_at` BEFORE UPDATE ON `store`
FOR EACH ROW BEGIN
SET NEW.updated_at = CURRENT_TIMESTAMP;
END;$$
DELIMITER ;


DROP TRIGGER IF EXISTS `loyalty`.`review_updated_at`;
DELIMITER $$
USE `loyalty`$$
CREATE DEFINER=`admin`@` % ` TRIGGER `review_updated_at` BEFORE UPDATE ON `review`
FOR EACH ROW BEGIN
SET NEW.updated_at = CURRENT_TIMESTAMP;
END;$$
DELIMITER ;


DROP TRIGGER IF EXISTS `loyalty`.`comment_updated_at`;
DELIMITER $$
USE `loyalty`$$
CREATE DEFINER=`admin`@` % ` TRIGGER `comment_updated_at` BEFORE UPDATE ON `comment`
FOR EACH ROW BEGIN
SET NEW.updated_at = CURRENT_TIMESTAMP;
END;$$
DELIMITER ;


DROP TRIGGER IF EXISTS `loyalty`.`comment_edited_content_updated_at`;
DELIMITER $$
USE `loyalty`$$
CREATE DEFINER=`admin`@` % ` TRIGGER `comment_edited_content_updated_at` BEFORE UPDATE ON `comment_edited_content`
FOR EACH ROW BEGIN
SET NEW.updated_at = CURRENT_TIMESTAMP;
END;$$
DELIMITER ;


DROP TRIGGER IF EXISTS `loyalty`.`like_in_comment_updated_at`;
DELIMITER $$
USE `loyalty`$$
CREATE DEFINER=`admin`@` % ` TRIGGER `like_in_comment_updated_at` BEFORE UPDATE ON `like_in_comment`
FOR EACH ROW BEGIN
SET NEW.updated_at = CURRENT_TIMESTAMP;
END;$$
DELIMITER ;


DROP TRIGGER IF EXISTS `loyalty`.`rating_updated_at`;
DELIMITER $$
USE `loyalty`$$
CREATE DEFINER=`admin`@` % ` TRIGGER `rating_updated_at` BEFORE UPDATE ON `rating`
FOR EACH ROW BEGIN
SET NEW.updated_at = CURRENT_TIMESTAMP;
END;$$
DELIMITER ;


DROP TRIGGER IF EXISTS `loyalty`.`log_bill_updated_at`;
DELIMITER $$
USE `loyalty`$$
CREATE DEFINER=`admin`@` % ` TRIGGER `log_bill_updated_at` BEFORE UPDATE ON `log_bill`
FOR EACH ROW BEGIN
SET NEW.updated_at = CURRENT_TIMESTAMP;
END;$$
DELIMITER ;


DROP TRIGGER IF EXISTS `loyalty`.`log_point_saving_updated_at`;
DELIMITER $$
USE `loyalty`$$
CREATE DEFINER=`admin`@` % ` TRIGGER `log_point_saving_updated_at` BEFORE UPDATE ON `log_point_saving`
FOR EACH ROW BEGIN
SET NEW.updated_at = CURRENT_TIMESTAMP;
END;$$
DELIMITER ;


DROP TRIGGER IF EXISTS `loyalty`.`log_user_action_updated_at`;
DELIMITER $$
USE `loyalty`$$
CREATE DEFINER=`admin`@` % ` TRIGGER `log_user_action_updated_at` BEFORE UPDATE ON `log_user_action`
FOR EACH ROW BEGIN
SET NEW.updated_at = CURRENT_TIMESTAMP;
END;$$
DELIMITER ;


DROP TRIGGER IF EXISTS `loyalty`.`log_system_updated_at`;
DELIMITER $$
USE `loyalty`$$
CREATE DEFINER=`admin`@` % ` TRIGGER `log_system_updated_at` BEFORE UPDATE ON `log_system`
FOR EACH ROW BEGIN
SET NEW.updated_at = CURRENT_TIMESTAMP;
END;$$
DELIMITER ;