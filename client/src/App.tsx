import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { useEffect, useState } from "react";
import { LanguageProvider } from "./lib/LanguageContext";
import { FirebaseProvider } from "./lib/FirebaseContext";
import { AuthProvider } from "./lib/AuthContext";

// Auth pages
import Login from "@/pages/Login";
import Profile from "@/pages/Profile";

import Home from "@/pages/Home";
import ClassicGame from "@/pages/ClassicGame";
import SpeedGame from "@/pages/SpeedGame";
import TimeGame from "@/pages/TimeGame";
import LiveGame from "@/pages/LiveGame";
import TestGame from "@/pages/TestGame";
import GameScreen from "@/pages/GameScreen";
import TestCreate from "@/pages/TestCreate";
import TestDetail from "@/pages/TestDetail";
import Categories from "@/pages/Categories";
import Tests from "@/pages/Tests"; 
import Contact from "@/pages/Contact";
import HowToPlay from "@/pages/HowToPlay";
import NotFound from "@/pages/not-found";
import Admin from "@/pages/Admin";

import Sidebar from "@/components/layout/Sidebar";
import Footer from "@/components/layout/Footer";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/game/classic" component={ClassicGame} />
      <Route path="/game/speed" component={SpeedGame} />
      <Route path="/game/time" component={TimeGame} />
      <Route path="/game/live" component={LiveGame} />
      <Route path="/game/test" component={TestGame} />
      <Route path="/play/:testId" component={GameScreen} />
      <Route path="/test-game/:testId" component={GameScreen} />
      <Route path="/test/:testId" component={TestDetail} />
      <Route path="/categories" component={Categories} />
      <Route path="/tests" component={Tests} />
      <Route path="/create" component={TestCreate} />
      <Route path="/create-test" component={TestCreate} />
      <Route path="/support" component={() => 
        <div className="text-center p-10">
          <h1 className="text-2xl font-bold mb-4">Destek</h1>
          <p className="text-muted-foreground">Bu sayfa geliştirme aşamasındadır.</p>
        </div>
      } />
      <Route path="/contact" component={Contact} />
      <Route path="/how-to-play" component={HowToPlay} />
      <Route path="/login" component={Login} />
      <Route path="/profile" component={Profile} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  const isGameScreen = location.startsWith('/play/') || location.startsWith('/test-game/');

  useEffect(() => {
    // Apply dark mode by default
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <FirebaseProvider>
        <LanguageProvider>
          <AuthProvider>
            <div className="min-h-screen flex bg-background text-foreground">
              {!isGameScreen && <Sidebar />}
              <main className={`flex-grow ${!isGameScreen ? 'p-4 md:p-6' : 'w-full'}`}>
                <Router />
              </main>
            </div>
            <Toaster />
          </AuthProvider>
        </LanguageProvider>
      </FirebaseProvider>
    </QueryClientProvider>
  );
}

export default App;