
-- Örnek Test 1: Film Karakterleri Testi
INSERT INTO tests (
  uuid,
  title,
  description,
  category_id,
  creator_id,
  questions,
  difficulty,
  is_public,
  approved,
  image_url,
  is_anonymous
) VALUES (
  gen_random_uuid(),
  'Film Karakterleri Testi',
  'Popüler film karakterlerini ne kadar iyi tanıyorsunuz? Bu test sizin film bilginizi ölçecek!',
  (SELECT id FROM categories WHERE name = 'Film & TV' LIMIT 1),
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
  '[
    {
      "question": "Bu ünlü Star Wars karakteri kimdir?",
      "image_url": "https://images.unsplash.com/photo-1608889175123-8ee362201f81",
      "options": ["Darth Vader", "Luke Skywalker", "Obi-Wan Kenobi", "Yoda"],
      "correctAnswer": 0,
      "explanation": "Bu karakter Darth Vader, Star Wars serisinin en ikonik kötü karakteridir."
    },
    {
      "question": "Harry Potter serisinden bu karakter kimdir?",
      "image_url": "https://images.unsplash.com/photo-1598153346810-860daa814c4b",
      "options": ["Hermione Granger", "Luna Lovegood", "Ginny Weasley", "Bellatrix Lestrange"],
      "correctAnswer": 1,
      "explanation": "Bu karakter Luna Lovegood, Harry Potter serisinin sevilen yan karakterlerinden biridir."
    }
  ]',
  2,
  true,
  true,
  'https://images.unsplash.com/photo-1608889175123-8ee362201f81',
  false
);

-- Örnek Test 2: Klasik Arabalar Testi
INSERT INTO tests (
  uuid,
  title,
  description,
  category_id,
  creator_id,
  questions,
  difficulty,
  is_public,
  approved,
  image_url,
  is_anonymous
) VALUES (
  gen_random_uuid(),
  'Klasik Arabalar Testi',
  'Klasik otomobilleri tanıyabilecek misiniz? Bu test ile otomobil bilginizi test edin!',
  (SELECT id FROM categories WHERE name = 'Arabalar' LIMIT 1),
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
  '[
    {
      "question": "Bu klasik Ferrari modeli hangisidir?",
      "image_url": "https://images.unsplash.com/photo-1583121274602-3e2820c69888",
      "options": ["Ferrari 250 GTO", "Ferrari Testarossa", "Ferrari F40", "Ferrari 458 Italia"],
      "correctAnswer": 2,
      "explanation": "Bu araç Ferrari F40, markanın en ikonik modellerinden biridir."
    },
    {
      "question": "Bu klasik Amerikan muscle car hangi markaya ait?",
      "image_url": "https://images.unsplash.com/photo-1585011070837-1e17e6d64af7",
      "options": ["Ford Mustang", "Chevrolet Camaro", "Dodge Challenger", "Plymouth Barracuda"],
      "correctAnswer": 0,
      "explanation": "Bu araç bir Ford Mustang, Amerikan muscle car tarihinin en önemli modellerinden biridir."
    }
  ]',
  3,
  true,
  true,
  'https://images.unsplash.com/photo-1583121274602-3e2820c69888',
  false
);
