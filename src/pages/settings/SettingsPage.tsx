import { Bug, Database, Lock, Palette, Sparkles, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutTab } from "./tabs/LayoutTab";
import { PrivacyTab } from "./tabs/PrivacyTab";
import { TestDataTab } from "./tabs/TestDataTab";
import { CorrectionsTab } from "./tabs/CorrectionsTab";
import { MembersTab } from "./tabs/MembersTab";
import { AiTab } from "./tabs/AiTab";

export default function SettingsPage() {
  return (
    <div>
      <PageHeader
        title="Configurações"
        description="Preferências da clínica, identidade visual e papéis."
      />

      <Tabs defaultValue="layout">
        <TabsList>
          <TabsTrigger value="layout">
            <Palette className="mr-1 h-4 w-4" /> Layout
          </TabsTrigger>
          <TabsTrigger value="members">
            <Users className="mr-1 h-4 w-4" /> Membros
          </TabsTrigger>
          <TabsTrigger value="ai">
            <Sparkles className="mr-1 h-4 w-4" /> IA
          </TabsTrigger>
          <TabsTrigger value="corrections">
            <Bug className="mr-1 h-4 w-4" /> Correções
          </TabsTrigger>
          <TabsTrigger value="privacy">
            <Lock className="mr-1 h-4 w-4" /> Privacidade (LGPD)
          </TabsTrigger>
          <TabsTrigger value="test-data">
            <Database className="mr-1 h-4 w-4" /> Dados de teste
          </TabsTrigger>
        </TabsList>

        <TabsContent value="layout">
          <LayoutTab />
        </TabsContent>

        <TabsContent value="members">
          <MembersTab />
        </TabsContent>

        <TabsContent value="ai">
          <AiTab />
        </TabsContent>

        <TabsContent value="corrections">
          <CorrectionsTab />
        </TabsContent>

        <TabsContent value="privacy">
          <PrivacyTab />
        </TabsContent>

        <TabsContent value="test-data">
          <TestDataTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
