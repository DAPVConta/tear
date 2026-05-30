import { Database, Lock, Palette } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutTab } from "./tabs/LayoutTab";
import { PrivacyTab } from "./tabs/PrivacyTab";
import { TestDataTab } from "./tabs/TestDataTab";

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
