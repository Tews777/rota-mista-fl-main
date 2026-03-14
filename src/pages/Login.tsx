import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "sonner";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(`Erro ao fazer login: ${error.message}`);
        return;
      }

      toast.success("Login realizado com sucesso!");
      navigate("/");
    } catch (err) {
      toast.error("Erro ao fazer login");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md p-8 bg-slate-800 border-slate-700">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-orange-500">Rota Mista FL</h1>
            <p className="text-slate-400">Hub de Florianópolis</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Email</label>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Senha</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>

            <Button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            >
              {loading ? "Autenticando..." : "Entrar"}
            </Button>
          </form>

          <div className="border-t border-slate-600 pt-6">
            <p className="text-xs text-slate-400 mb-3">Contas disponíveis:</p>
            <div className="space-y-2 text-xs">
              <div className="bg-slate-700 p-3 rounded">
                <p className="font-mono text-slate-200">operador1@floripa.local</p>
                <p className="text-slate-400">senha: operador123</p>
              </div>
              <div className="bg-slate-700 p-3 rounded">
                <p className="font-mono text-slate-200">operador2@floripa.local</p>
                <p className="text-slate-400">senha: operador123</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500 text-center">
            O histórico é compartilhado entre os 2 usuários
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Login;
