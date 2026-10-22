import type { LucideIconName } from "@/components/DynamicIcon";

export type Category = {
  name: string;
  icon: LucideIconName;
};

export const categories = [
  { name: "Supermercado", icon: "ShoppingCart" },
  { name: "Alimentos e bebidas", icon: "Utensils" },
  { name: "Restaurantes, bares e lanchonetes", icon: "UtensilsCrossed" },
  { name: "Delivery", icon: "Bike" },
  { name: "Feiras e hortifruti", icon: "Apple" },
  { name: "Padaria", icon: "Croissant" },
  { name: "Cafeteria", icon: "Coffee" },
  { name: "Compras", icon: "ShoppingBag" },
  { name: "Compras online", icon: "Package" },
  { name: "Eletrônicos e tecnologia", icon: "Smartphone" },
  { name: "Vestuário e acessórios", icon: "Shirt" },
  { name: "Artigos infantis", icon: "Baby" },
  { name: "Casa e decoração", icon: "House" },
  { name: "Móveis e eletrodomésticos", icon: "Armchair" },
  { name: "Artigos esportivos", icon: "Dumbbell" },
  { name: "Papelaria", icon: "Notebook" },
  { name: "Presentes", icon: "Gift" },
  { name: "Beleza e cuidados pessoais", icon: "Sparkles" },
  { name: "Petshop e veterinário", icon: "PawPrint" },
  { name: "Saúde", icon: "HeartPulse" },
  { name: "Medicamentos", icon: "Pill" },
  { name: "Educação e cursos", icon: "GraduationCap" },
  { name: "Livros e entretenimento", icon: "BookOpen" },
  { name: "Cinema e eventos", icon: "Clapperboard" },
  { name: "Viagens", icon: "Plane" },
  { name: "Hospedagem", icon: "BedDouble" },
  { name: "Transporte público", icon: "Bus" },
  { name: "Combustível", icon: "Fuel" },
  { name: "Estacionamento", icon: "ParkingCircle" },
  { name: "Manutenção do veículo", icon: "Wrench" },
  { name: "Aplicativos de transporte", icon: "Car" },
  { name: "Aluguel e condomínio", icon: "Building2" },
  { name: "Energia elétrica", icon: "Zap" },
  { name: "Água", icon: "Droplets" },
  { name: "Internet e telefone", icon: "Wifi" },
  { name: "Assinaturas", icon: "Repeat" },
  { name: "Impostos e taxas", icon: "Receipt" },
  { name: "Seguros", icon: "ShieldCheck" },
  { name: "Financiamento", icon: "Landmark" },
  { name: "Empréstimos", icon: "HandCoins" },
  { name: "Cartão de crédito", icon: "CreditCard" },
  { name: "Tarifas bancárias", icon: "Landmark" },
  { name: "Investimentos", icon: "TrendingUp" },
  { name: "Doações", icon: "Heart" },
  { name: "Cashback e cupons", icon: "BadgePercent" },
  { name: "Salário", icon: "Banknote" },
  { name: "Freelance e serviços prestados", icon: "Briefcase" },
  { name: "Benefícios", icon: "BadgeCheck" },
  { name: "Serviços", icon: "Calculator" },
] satisfies Category[];

const legacyCategoryIcons: Record<string, LucideIconName> = {
  mercado: "ShoppingCart",
  transporte: "Car",
  lazer: "Coffee",
  outros: "MoreHorizontal",
};

export function getCategoryIcon(categoryName: string): LucideIconName {
  const normalizedName = categoryName.trim().toLocaleLowerCase("pt-BR");
  const category = categories.find(
    ({ name }) => name.toLocaleLowerCase("pt-BR") === normalizedName,
  );

  return category?.icon ?? legacyCategoryIcons[normalizedName] ?? "Tag";
}
