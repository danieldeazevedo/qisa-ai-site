import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, MessageCircle, Image, Shield } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                <Bot className="text-white text-lg" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Qisa
              </h1>
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
            © 2024 Qisa. Powered by Google Gemini AI.
          </p>
        </div>
      </footer>
    </div>
  );
}