import { LazyMotion, domAnimation, m, type Variants } from "framer-motion";
import type { ReactNode } from "react";

// Primitivas de movimento sóbrias (régua clínica): rápidas (150–220ms),
// discretas, sem "bounce". Respeitam prefers-reduced-motion via Framer.
//
// Usa LazyMotion + o componente leve `m` (em vez de `motion`): o boot carrega
// só ~6 KB; as features de animação (domAnimation) entram sob demanda. Mantém
// o pass de performance — Framer não infla o entry.

const EASE = [0.22, 1, 0.36, 1] as const; // easeOutExpo suave

// Provider único do LazyMotion — monte uma vez no topo do shell.
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}

// Transição de página: fade + leve subida.
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <m.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: EASE }}
    >
      {children}
    </m.div>
  );
}

// Container que escalona a entrada dos filhos (listas, grids de card).
const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04, delayChildren: 0.02 } },
};

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: EASE } },
};

export function Stagger({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <m.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className={className}
    >
      {children}
    </m.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <m.div variants={staggerItem} className={className}>
      {children}
    </m.div>
  );
}
