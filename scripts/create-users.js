// Script para criar usuários no Supabase
// Execute no console do navegador após estar logado ou use a API diretamente
// Para usar localmente, rode: node scripts/create-users.js (requer SDK Node)

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://rnexmtqpkokodcbkdolu.supabase.co";
// IMPORTANTE: Usar a CHAVE DE ADMIN (não publicável) para criar usuários
// Obtenha em: Settings > API > Project API Keys > Service Role Key
const supabaseAdminKey = "YOUR_SUPABASE_ADMIN_KEY_HERE";

const supabase = createClient(supabaseUrl, supabaseAdminKey);

async function createUsers() {
  const users = [
    {
      email: "analista01@floripa.local",
      password: "analista01",
      displayName: "Analista 1",
    },
    {
      email: "analista02@floripa.local",
      password: "analista02",
      displayName: "Analista 2",
    },
  ];

  for (const user of users) {
    console.log(`Criando usuário: ${user.email}...`);
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          display_name: user.displayName,
        },
      });

      if (error) {
        console.error(`Erro ao criar ${user.email}:`, error.message);
      } else {
        console.log(`✓ Usuário criado: ${user.email}`);
        console.log(`  ID: ${data.user?.id}`);
      }
    } catch (err) {
      console.error(`Erro geral ao criar ${user.email}:`, err);
    }
  }
}

createUsers();
