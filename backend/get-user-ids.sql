SELECT id, email, "phoneNumber", role 
FROM "User" 
WHERE email IN ('lucy@wakilipro.com', 'james@wakilipro.com', 'grace@wakilipro.com')
ORDER BY email;
