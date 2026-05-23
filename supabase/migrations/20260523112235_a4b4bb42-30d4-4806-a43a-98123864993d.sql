UPDATE auth.users
SET encrypted_password = crypt('zasadaser77', gen_salt('bf')),
    updated_at = now()
WHERE lower(email) = 'sergovinst@gmail.com';