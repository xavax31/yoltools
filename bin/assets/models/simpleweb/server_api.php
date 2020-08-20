<?php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL & ~E_NOTICE);
error_reporting(E_ALL);


$message = $_POST["message"];

file_put_contents("data/result.txt", $message);

echo $message;
?>