export type Language = 'tr' | 'en';

export type TranslationKey = 
  // Common UI elements
  | 'search' 
  | 'filter'
  | 'all'
  | 'categories'
  | 'tests'
  | 'popular'
  | 'newest'
  | 'featured'
  | 'play'
  | 'create'
  | 'createTest'
  | 'allCategories'
  | 'allTests'
  | 'seeAll'
  | 'home'
  | 'howToPlay'
  | 'contact'
  | 'login'
  | 'signup'
  | 'logout'
  | 'players'
  | 'loading'
  | 'language'
  
  // Footer sections
  | 'quickLinks'
  | 'legal'
  | 'contactUs'
  | 'termsOfService'
  | 'privacyPolicy'
  | 'cookiePolicy'
  | 'announcements'
  | 'allRightsReserved'
  | 'supportUs'
  
  // Category names
  | 'catLiterature'
  | 'catGeography'
  | 'catFilmTV'
  | 'catArt'
  | 'catGames'
  | 'catMore'
  
  // Home page
  | 'heroTitle'
  | 'heroDescription'
  | 'startPlaying'
  | 'learnMore'
  | 'discoverByCategory'
  | 'moreCategories'
  
  // Categories
  | 'categoriesTitle'
  | 'categoriesDescription'
  | 'noCategoriesFound'
  | 'tryDifferentKeywords'
  | 'clearSearch'
  | 'noCategories'
  | 'checkLater'
  
  // Tests
  | 'testsTitle'
  | 'testsDescription'
  | 'findTest'
  | 'noTestsFound'
  | 'tryDifferentFilters'
  | 'clearFilters'
  | 'noTests'
  | 'difficulty'
  | 'allDifficulties'
  | 'category'
  | 'sort'
  | 'newestFirst'
  | 'oldestFirst'
  | 'mostPopular'
  | 'difficultEasyToHard'
  | 'difficultHardToEasy'
  | 'questions'
  | 'question'
  
  // How to Play
  | 'howToPlayTitle'
  | 'howToPlayDescription'
  | 'testGameSystem'
  | 'findingTests'
  | 'solvingTests'
  | 'creatingTests'
  | 'pointSystem'
  | 'leaderboard'
  | 'howToGetRanked'
  | 'accountCreation'
  | 'whyCreateAccount'
  | 'multiplayerModes'
  | 'comingSoon'
  | 'multiplayerFeatures'
  | 'followSocial'
  
  // Test Game
  | 'guess'
  | 'skip'
  | 'correct'
  | 'incorrect'
  | 'timeLeft'
  | 'score'
  | 'totalScore'
  | 'yourAnswer'
  | 'correctAnswer'
  
  // Difficulty Levels
  | 'easy'
  | 'medium'
  | 'hard'
  | 'veryHard'
  | 'expert';

export const translations: Record<Language, Record<TranslationKey, string>> = {
  en: {
    // Common UI elements
    search: 'Search',
    filter: 'Filter',
    all: 'All',
    categories: 'Categories',
    tests: 'Tests',
    popular: 'Popular',
    newest: 'Newest',
    featured: 'Featured',
    play: 'Play',
    create: 'Create',
    createTest: 'Create Test',
    allCategories: 'All Categories',
    allTests: 'All Tests',
    seeAll: 'See All',
    home: 'Home',
    howToPlay: 'How to Play',
    contact: 'Contact',
    login: 'Login',
    signup: 'Sign Up',
    logout: 'Logout',
    players: 'Players',
    loading: 'Loading...',
    language: 'Language',

    // Footer sections
    quickLinks: 'Quick Links',
    legal: 'Legal',
    contactUs: 'Contact Us',
    termsOfService: 'Terms of Service',
    privacyPolicy: 'Privacy Policy',
    cookiePolicy: 'Cookie Policy',
    announcements: 'Announcements',
    allRightsReserved: 'All Rights Reserved',
    supportUs: 'Support Us',

    // Category names
    catLiterature: 'Literature',
    catGeography: 'Geography',
    catFilmTV: 'Film & TV',
    catArt: 'Art',
    catGames: 'Games',
    catMore: 'More',

    // Home page
    heroTitle: 'Test Your Recognition Skills',
    heroDescription: 'Challenge yourself with progressive image reveals across various categories.',
    startPlaying: 'Start Playing',
    learnMore: 'Learn More',
    discoverByCategory: 'Discover by Category',
    moreCategories: 'More Categories',

    // Categories
    categoriesTitle: 'Explore Categories',
    categoriesDescription: 'Discover tests across diverse categories.',
    noCategoriesFound: 'No categories found',
    tryDifferentKeywords: 'Try different keywords',
    clearSearch: 'Clear search',
    noCategories: 'No categories available',
    checkLater: 'Please check back later',

    // Tests
    testsTitle: 'Explore Tests',
    testsDescription: 'Find the perfect test to challenge yourself.',
    findTest: 'Find a test',
    noTestsFound: 'No tests found',
    tryDifferentFilters: 'Try different filters',
    clearFilters: 'Clear filters',
    noTests: 'No tests available',
    difficulty: 'Difficulty',
    allDifficulties: 'All Difficulties',
    category: 'Category',
    sort: 'Sort',
    newestFirst: 'Newest First',
    oldestFirst: 'Oldest First',
    mostPopular: 'Most Popular',
    difficultEasyToHard: 'Easy to Hard',
    difficultHardToEasy: 'Hard to Easy',
    questions: 'Questions',
    question: 'Question',

    // How to Play
    howToPlayTitle: 'How to Play',
    howToPlayDescription: 'Learn the rules and mechanics of the game.',
    testGameSystem: 'Test Game System',
    findingTests: 'Finding Tests',
    solvingTests: 'Solving Tests',
    creatingTests: 'Creating Tests',
    pointSystem: 'Point System',
    leaderboard: 'Leaderboard',
    howToGetRanked: 'How to Get Ranked',
    accountCreation: 'Account Creation',
    whyCreateAccount: 'Why Create an Account',
    multiplayerModes: 'Multiplayer Modes',
    comingSoon: 'Coming Soon',
    multiplayerFeatures: 'Multiplayer Features',
    followSocial: 'Follow Us on Social Media',

    // Test Game
    guess: 'Guess',
    skip: 'Skip',
    correct: 'Correct!',
    incorrect: 'Incorrect',
    timeLeft: 'Time Left',
    score: 'Score',
    totalScore: 'Total Score',
    yourAnswer: 'Your Answer',
    correctAnswer: 'Correct Answer',

    // Difficulty Levels
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    veryHard: 'Very Hard',
    expert: 'Expert'
  },
  tr: {
    // Common UI elements
    search: 'Ara',
    filter: 'Filtrele',
    all: 'Tümü',
    categories: 'Kategoriler',
    tests: 'Testler',
    popular: 'Popüler',
    newest: 'En Yeni',
    featured: 'Öne Çıkan',
    play: 'Oyna',
    create: 'Oluştur',
    createTest: 'Test Oluştur',
    allCategories: 'Tüm Kategoriler',
    allTests: 'Tüm Testler',
    seeAll: 'Tümünü Gör',
    home: 'Ana Sayfa',
    howToPlay: 'Nasıl Oynanır',
    contact: 'İletişim',
    login: 'Giriş Yap',
    signup: 'Kayıt Ol',
    logout: 'Çıkış Yap',
    players: 'Oyuncular',
    loading: 'Yükleniyor...',
    language: 'Dil',

    // Footer sections
    quickLinks: 'Hızlı Bağlantılar',
    legal: 'Yasal',
    contactUs: 'Bize Ulaşın',
    termsOfService: 'Kullanım Koşulları',
    privacyPolicy: 'Gizlilik Politikası',
    cookiePolicy: 'Çerez Politikası',
    announcements: 'Duyurular',
    allRightsReserved: 'Tüm Hakları Saklıdır',
    supportUs: 'Bizi Destekleyin',

    // Category names
    catLiterature: 'Edebiyat',
    catGeography: 'Coğrafya',
    catFilmTV: 'Film ve Dizi',
    catArt: 'Sanat',
    catGames: 'Oyunlar',
    catMore: 'Daha Fazla',

    // Home page
    heroTitle: 'Tanıma Becerilerinizi Test Edin',
    heroDescription: 'Çeşitli kategorilerde aşamalı görsel açılımlarıyla kendinizi zorlayın.',
    startPlaying: 'Oynamaya Başla',
    learnMore: 'Daha Fazla Bilgi',
    discoverByCategory: 'Kategoriye Göre Keşfet',
    moreCategories: 'Daha Fazla Kategori',

    // Categories
    categoriesTitle: 'Kategorileri Keşfet',
    categoriesDescription: 'Çeşitli kategorilerdeki testleri keşfedin.',
    noCategoriesFound: 'Kategori bulunamadı',
    tryDifferentKeywords: 'Farklı anahtar kelimeler deneyin',
    clearSearch: 'Aramayı temizle',
    noCategories: 'Kategori bulunamadı',
    checkLater: 'Lütfen daha sonra tekrar kontrol edin',

    // Tests
    testsTitle: 'Testleri Keşfet',
    testsDescription: 'Kendinizi zorlayacak mükemmel testi bulun.',
    findTest: 'Test bul',
    noTestsFound: 'Test bulunamadı',
    tryDifferentFilters: 'Farklı filtreler deneyin',
    clearFilters: 'Filtreleri temizle',
    noTests: 'Test bulunamadı',
    difficulty: 'Zorluk',
    allDifficulties: 'Tüm Zorluklar',
    category: 'Kategori',
    sort: 'Sırala',
    newestFirst: 'En Yeni',
    oldestFirst: 'En Eski',
    mostPopular: 'En Popüler',
    difficultEasyToHard: 'Kolaydan Zora',
    difficultHardToEasy: 'Zordan Kolaya',
    questions: 'Sorular',
    question: 'Soru',

    // How to Play
    howToPlayTitle: 'Nasıl Oynanır',
    howToPlayDescription: 'Oyunun kurallarını ve mekaniklerini öğrenin.',
    testGameSystem: 'Test Oyun Sistemi',
    findingTests: 'Test Bulma',
    solvingTests: 'Test Çözme',
    creatingTests: 'Test Oluşturma',
    pointSystem: 'Puan Sistemi',
    leaderboard: 'Liderlik Tablosu',
    howToGetRanked: 'Nasıl Sıralanırsınız',
    accountCreation: 'Hesap Oluşturma',
    whyCreateAccount: 'Neden Hesap Oluşturmalısınız',
    multiplayerModes: 'Çok Oyunculu Modlar',
    comingSoon: 'Çok Yakında',
    multiplayerFeatures: 'Çok Oyunculu Özellikler',
    followSocial: 'Sosyal Medyada Bizi Takip Edin',

    // Test Game
    guess: 'Tahmin Et',
    skip: 'Atla',
    correct: 'Doğru!',
    incorrect: 'Yanlış',
    timeLeft: 'Kalan Süre',
    score: 'Puan',
    totalScore: 'Toplam Puan',
    yourAnswer: 'Cevabınız',
    correctAnswer: 'Doğru Cevap',

    // Difficulty Levels
    easy: 'Kolay',
    medium: 'Orta',
    hard: 'Zor',
    veryHard: 'Çok Zor',
    expert: 'Uzman'
  }
};