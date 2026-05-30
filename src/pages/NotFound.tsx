import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/brand/Logo";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-6">
      <div className="text-center">
        <LogoMark className="mx-auto h-16 w-16" />
        <p className="mt-8 text-6xl font-extrabold tracking-tight text-primary">
          404
        </p>
        <h1 className="mt-2 text-xl font-bold">Página não encontrada</h1>
        <p className="mt-2 text-muted-foreground">
          O endereço que você tentou acessar não existe.
        </p>
        <Button asChild variant="brand" size="lg" className="mt-8">
          <Link to="/">Voltar ao início</Link>
        </Button>
      </div>
    </div>
  );
}
