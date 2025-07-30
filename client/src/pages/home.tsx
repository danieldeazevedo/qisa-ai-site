import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Bot, MessageCircle, Image, Shield, User } from "lucide-react";

export default function Home() {
  const { user, login, logout, loading } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                <Bot className="text-white text-lg" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Qisa
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {loading ? (
                <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
              ) : user ? (
                <div className="flex items-center space-x-2">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="Profile"
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <span className="text-sm text-gray-600">{user.displayName || user.email}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={logout}
                    className="text-gray-600 hover:text-primary"
                  >
                    Sair
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={login}
                  className="text-gray-600 hover:text-primary"
                >
                  <User className="w-4 h-4 mr-2" />
                  Entrar
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-primary to-secondary rounded-3xl mb-6 shadow-lg">
              <Bot className="text-white text-3xl" />
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Bem-vindo à{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Qisa
              </span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Sua assistente de IA avançada que conversa naturalmente e gera
              imagens incríveis a partir de suas ideias. Explore o futuro da
              inteligência artificial conversacional.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-12 max-w-3xl mx-auto">
            <Card className="border border-gray-100">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <MessageCircle className="text-primary text-xl" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Conversação Natural
                </h3>
                <p className="text-gray-600">
                  Converse de forma natural sobre qualquer assunto. A Qisa
                  entende contexto e mantém conversas fluidas.
                </p>
              </CardContent>
            </Card>
            <Card className="border border-gray-100">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <Image className="text-secondary text-xl" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Geração de Imagens
                </h3>
                <p className="text-gray-600">
                  Transforme suas ideias em imagens únicas. Descreva o que
                  imagina e veja ganhar vida.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* CTA Button */}
          <div className="space-y-4">
            <Link href="/chat">
              <Button
                size="lg"
                className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-lg"
              >
                <MessageCircle className="mr-3" />
                Conversar com a Qisa
              </Button>
            </Link>
            <p className="text-sm text-gray-500">
              <Shield className="inline w-4 h-4 mr-1" />
              Suas conversas são seguras e privadas
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-600">
            © 2024 Qisa. Powered by Google Gemini AI & Firebase.
          </p>
        </div>
      </footer>
    </div>
  );
}
