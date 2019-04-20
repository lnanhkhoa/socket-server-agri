



CREATE USER 'agri'@'%' IDENTIFIED BY 'agrismart@12356789';
ALTER USER 'agri'@'%' IDENTIFIED WITH mysql_native_password BY 'agrismart@12356789';
GRANT ALL PRIVILEGES ON * . * TO 'agri'@'%';
flush privileges;