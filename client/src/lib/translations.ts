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
  tr: {
    // Common UI elements
    search: 'Ara',
    filter: 'Filtrele',
    all: 'Tümü',
    categories: 'Kategoriler',
    tests: 'Testler',
    popular: 'Popüler',
    newest: 'Yeni Eklenenler',
    featured: 'Öne Çıkanlar',
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
    players: 'oyuncu',
    loading: 'Test Yükleniyor...',
    language: 'tr',
    
    // Footer sections
    quickLinks: 'Hızlı Bağlantılar',
    legal: 'Yasal',
    contactUs: 'İletişim',
    termsOfService: 'Kullanım Koşulları',
    privacyPolicy: 'Gizlilik Politikası',
    cookiePolicy: 'Çerez Politikası',
    announcements: 'Duyurular',
    allRightsReserved: 'Tüm hakları saklıdır',
    supportUs: 'Destek Ol',
    
    // Category names
    catLiterature: 'Edebiyat',
    catGeography: 'Coğrafya',
    catFilmTV: 'Film ve TV',
    catArt: 'Sanat',
    catGames: 'Oyunlar',
    catMore: 'Daha Fazla',
    
    // Home page
    heroTitle: 'Görsel tanıma yeteneklerinizi test edin',
    heroDescription: 'Pixelhunt\'ta resimler adım adım açılır ve doğru cevabı en hızlı şekilde bulmanız gerekir.',
    startPlaying: 'Oynamaya Başla',
    learnMore: 'Daha Fazla Bilgi',
    discoverByCategory: 'Kategorilere Göre Keşfet',
    moreCategories: 'Daha Fazla',
    
    // Categories
    categoriesTitle: 'Kategoriler',
    categoriesDescription: 'Farklı kategorilerde binlerce görsel ve testi keşfedin.',
    noCategoriesFound: 'Arama kriterinizle eşleşen kategori bulunamadı',
    tryDifferentKeywords: 'Lütfen farklı anahtar kelimelerle tekrar deneyin',
    clearSearch: 'Aramayı Temizle',
    noCategories: 'Henüz kategori bulunmuyor',
    checkLater: 'Daha sonra tekrar kontrol edin',
    
    // Tests
    testsTitle: 'Testler',
    testsDescription: 'Oluşturulan testlere göz atın, zekânızı ve görsel hafızanızı test edin.',
    findTest: 'Test ara...',
    noTestsFound: 'Arama kriterinizle eşleşen test bulunamadı',
    tryDifferentFilters: 'Lütfen farklı filtreler veya anahtar kelimelerle tekrar deneyin',
    clearFilters: 'Filtreleri Temizle',
    noTests: 'Henüz test bulunmuyor',
    difficulty: 'Zorluk',
    allDifficulties: 'Tüm Zorluklar',
    category: 'Kategori',
    sort: 'Sıralama',
    newestFirst: 'En Yeni',
    oldestFirst: 'En Eski',
    mostPopular: 'En Popüler',
    difficultEasyToHard: 'Zorluk (Kolay-Zor)',
    difficultHardToEasy: 'Zorluk (Zor-Kolay)',
    questions: 'soru',
    question: 'soru',
    
    // How to Play
    howToPlayTitle: 'Nasıl Oynanır?',
    howToPlayDescription: 'Pixelhunt\'ta testler ile görsellerinizi tanıma yeteneklerinizi sınayın ve kendi testlerinizi oluşturun.',
    testGameSystem: 'Test Oyun Sistemi',
    findingTests: 'Test Bulma ve Keşfetme',
    solvingTests: 'Test Çözme',
    creatingTests: 'Test Oluşturma',
    pointSystem: 'Puan Sistemi',
    leaderboard: 'Puan Sıralaması',
    howToGetRanked: 'Nasıl sıralamaya girerim?',
    accountCreation: 'Hesap Oluşturma',
    whyCreateAccount: 'Neden hesap oluşturmalıyım?',
    multiplayerModes: 'Çok Oyunculu Modlar',
    comingSoon: 'Yakında Eklenecek',
    multiplayerFeatures: 'Çok Oyunculu Modlarda Neler Olacak?',
    followSocial: 'Çok oyunculu modların lansman tarihiyle ilgili güncellemeler için sosyal medya hesaplarımızı takip edin.',
    
    // Test Game
    guess: 'Tahmin Et',
    skip: 'Pas Geç',
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
  },
  
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
    players: 'players',
    loading: 'Loading Test...',
    
    // Category names
    catLiterature: 'Literature',
    catGeography: 'Geography',
    catFilmTV: 'Film & TV',
    catArt: 'Art',
    catGames: 'Games',
    catMore: 'More',
    
    // Home page
    heroTitle: 'Test your visual recognition skills',
    heroDescription: 'In Pixelhunt, images are gradually revealed and you need to find the correct answer as quickly as possible.',
    startPlaying: 'Start Playing',
    learnMore: 'Learn More',
    discoverByCategory: 'Discover by Category',
    moreCategories: 'More',
    
    // Categories
    categoriesTitle: 'Categories',
    categoriesDescription: 'Explore thousands of images and tests in different categories.',
    noCategoriesFound: 'No categories found matching your search criteria',
    tryDifferentKeywords: 'Please try again with different keywords',
    clearSearch: 'Clear Search',
    noCategories: 'No categories available yet',
    checkLater: 'Check back later',
    
    // Tests
    testsTitle: 'Tests',
    testsDescription: 'Browse tests created by users, challenge your intellect and visual memory.',
    findTest: 'Find tests...',
    noTestsFound: 'No tests found matching your search criteria',
    tryDifferentFilters: 'Please try again with different filters or keywords',
    clearFilters: 'Clear Filters',
    noTests: 'No tests available yet',
    difficulty: 'Difficulty',
    allDifficulties: 'All Difficulties',
    category: 'Category',
    sort: 'Sort',
    newestFirst: 'Newest',
    oldestFirst: 'Oldest',
    mostPopular: 'Most Popular',
    difficultEasyToHard: 'Difficulty (Easy to Hard)',
    difficultHardToEasy: 'Difficulty (Hard to Easy)',
    questions: 'questions',
    question: 'question',
    
    // How to Play
    howToPlayTitle: 'How to Play?',
    howToPlayDescription: 'Challenge your visual recognition skills with tests in Pixelhunt and create your own tests.',
    testGameSystem: 'Test Game System',
    findingTests: 'Finding and Exploring Tests',
    solvingTests: 'Solving Tests',
    creatingTests: 'Creating Tests',
    pointSystem: 'Point System',
    leaderboard: 'Leaderboard',
    howToGetRanked: 'How do I get ranked?',
    accountCreation: 'Account Creation',
    whyCreateAccount: 'Why should I create an account?',
    multiplayerModes: 'Multiplayer Modes',
    comingSoon: 'Coming Soon',
    multiplayerFeatures: 'What Will Be in Multiplayer Modes?',
    followSocial: 'Follow our social media accounts for updates on the launch date of multiplayer modes.',
    
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
  }
};