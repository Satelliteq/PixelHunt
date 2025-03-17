import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupSupabaseTables } from "./supabase-setup";
import { initializeSupabaseTables } from "./initialize-tables";
import { setupDatabaseTables, checkIfTablesExist } from "./db-setup";
import { syncTablesWithSupabase } from "./db-supabase-sync";
import { initTables } from "./direct-db"; // Import direct-db initTables function

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Veritabanı tablolarını iki yaklaşımla da oluşturmayı dene
  let dbInitSuccess = false;
  
  // İlk olarak direct-db modülünü kullanarak tablo oluşturmayı dene
  try {
    await initTables();
    console.log('Direct-DB ile test tablosu başarıyla oluşturuldu.');
    dbInitSuccess = true;
  } catch (directDbError) {
    console.error('Direct-DB tabloları oluşturma hatası:', directDbError);
  }
  
  // Alternatif olarak doğrudan PostgreSQL bağlantısı ile tabloları oluştur
  if (!dbInitSuccess) {
    try {
      const tablesExist = await checkIfTablesExist();
      
      if (tablesExist) {
        console.log('Tablolar zaten mevcut, veritabanı kurulumu atlanıyor');
        dbInitSuccess = true;
      } else {
        await setupDatabaseTables();
        console.log('Doğrudan PostgreSQL bağlantısı ile tablolar oluşturuldu');
        dbInitSuccess = true;
      }
    } catch (dbError) {
      console.error('PostgreSQL tabloları oluşturma hatası:', dbError);
      console.log('Supabase yöntemi ile devam ediliyor...');
    }
  }
  
  // Alternatif olarak Supabase API ile tabloları oluşturmayı dene
  if (!dbInitSuccess) {
    try {
      await setupSupabaseTables();
      console.log('Supabase tabloları oluşturuldu veya güncellendi');
      dbInitSuccess = true;
    } catch (supaError) {
      console.error('Supabase tabloları oluşturma hatası:', supaError);
    }
  }
  
  // Ek olarak, Supabase JavaScript client ile initialize etmeyi dene
  try {
    await initializeSupabaseTables();
    console.log('Supabase tabloları JavaScript client ile initialize edildi');
  } catch (initError) {
    console.error('Supabase JavaScript client initialize hatası:', initError);
  }
  
  // PostgreSQL tabloları ile Supabase'i senkronize et
  // Bu adım, tabloların Supabase tarafından doğru şekilde görülmesini sağlar
  try {
    await syncTablesWithSupabase();
    console.log('Tablolar Supabase ile senkronize edildi');
  } catch (syncError) {
    console.error('Supabase senkronizasyon hatası:', syncError);
  }
  
  if (!dbInitSuccess) {
    console.warn('UYARI: Veritabanı tablolarının tam olarak oluşturulduğu doğrulanamadı');
    console.warn('Uygulama çalışmaya devam edecek ancak bazı veritabanı işlemleri başarısız olabilir');
  }
  
  // API rotalarını kaydet
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
