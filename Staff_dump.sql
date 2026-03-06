-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: nozomi.proxy.rlwy.net    Database: railway
-- ------------------------------------------------------
-- Server version	9.4.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `staff`
--

DROP TABLE IF EXISTS `staff`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staff` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ch_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('admin','doctor','reception','pharmacist','labtech','facility_clerk') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'doctor',
  `password` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `staff_ch_id_unique` (`ch_id`),
  UNIQUE KEY `staff_email_unique` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff`
--

LOCK TABLES `staff` WRITE;
/*!40000 ALTER TABLE `staff` DISABLE KEYS */;
INSERT INTO `staff` VALUES (1,'CH-96294','System','Admin','admin@hospital.com','0700000000','admin','$2y$12$z4mDd.UCWMrAfdjVM7wTJ.6DWAxCWypzIJbzZPWtHq6MrHYf8KZkS','2026-03-04 07:29:55','2026-03-04 07:29:55'),(2,'CH-36021','system','admin','admin@naitirijambo.com','null','admin','$2y$12$X6tUl.A6fJm/.Gq5aRuOheuOUS5EbfE1ffah55WIoT3NwA4WlVYCq','2026-03-04 08:02:47','2026-03-04 08:09:47'),(3,'CH-90819','Moses','Simiyu','moses@naitirijambo.com','0757144358','doctor','$2y$12$JsQtrkqig/zZTI.p5.58re5E5yiuZ6hh5eksJjhmfvmEslrgRuvde','2026-03-04 18:11:07','2026-03-04 18:11:07'),(4,'CH-71157','Vivian','Masika','vivian@naitirijambo.com','0704 002831','reception','$2y$12$JOaIf30HAzGMiGGTq2ksZOOlfvIzvJrWxRGYIiq6yNXs5S2pnpfLG','2026-03-04 18:17:40','2026-03-05 05:05:56'),(5,'CH-80069','Bravin','Wanjala','bravin@naitirijambo.com','0790679873','doctor','$2y$12$5CbR7Szx0/JsdbA.oEe3UucFjH/LZxVPgDphnIJ/YmWkRBDTMm0fS','2026-03-05 05:09:41','2026-03-05 05:09:41'),(6,'CH-56416','Benard','Ngichabe','benard@naitirijambo.com','0726427775','doctor','$2y$12$Or9UhV5LOQH.EPf7r1D84ObwwxTk2XrzkeGhq.a5JVMyNDyoZIxlC','2026-03-05 05:10:52','2026-03-05 05:10:52'),(7,'CH-32280','Catherine','Wanyama','cate@naitirijambo.com','0715790048','pharmacist','$2y$12$gjI1NFW7RMIca.OmiAtNVuUwVsnGFQQTYGUvw5Kukz8V7g6BBhgxW','2026-03-05 05:12:25','2026-03-05 05:12:25'),(8,'CH-25940','Mary','Mwangi','mary@naitirijambo.com','0710121020','pharmacist','$2y$12$3gaCA.LU.dP23/svlbm/ROgBs57y3j0nbvlyyCcS/Z/Zon0vbpau.','2026-03-05 05:13:38','2026-03-05 05:13:38'),(9,'CH-08874','Shillah','Nambo','nambo@naitirijambo.com','0792848652','pharmacist','$2y$12$dZpnvsk/wy7s1i8XnK0zgeQ9KpDXxHc1QkJZ5LQ.g53i2CakTMlRG','2026-03-05 05:14:45','2026-03-05 05:14:45'),(10,'CH-73449','SAMMY','SONGWA','samy@naitirijambo.com','0707379815','admin','$2y$12$zJUpaSjP2MQoSqI4.xEuEu5NzT28yyIPbM28u6AdrxkIuAgF0jN.e','2026-03-05 07:11:24','2026-03-05 07:11:24');
/*!40000 ALTER TABLE `staff` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-06 10:35:11
