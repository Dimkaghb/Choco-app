"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import freeDomLogo from "@/assets/freedomlogo.png"
import reportImg from "@/assets/Frame_2.png"
import dataImg from "@/assets/dataImg.png"
import { 
  ArrowRight, 
  Command, 
  Menu, 
  Github, 
  Twitter, 
  Check,
  BarChart3, 
  ShieldCheck, 
  Wallet, 
  ArrowUpDown 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Auth } from "@/components/auth";
import heroImg from "@/assets/hero.png";
import interfaceImg from "@/assets/chartInt.png"


// Features configuration
const features = [
  {
    title: "Продвинутый аналитический интерфейс",
    description: "Профессиональные инструменты анализа данных с визуализацией в реальном времени и расширенными возможностями построения графиков.",
    icon: <BarChart3 className="w-6 h-6" />,
    image: interfaceImg
  },
  {
    title: "Управление и создание отчетов",
    description: "Отслеживайте свои аналитические проекты и работайте с отчетностями быстро и качественно.",
    icon: <Wallet className="w-6 h-6" />,
    image: reportImg
  },
  {
    title: "Работа с данными",
    description: "Эффективная работа с данными любого объема и формата, включая импорт, экспорт и преобразование данных для анализа.",
    icon: <ShieldCheck className="w-6 h-6" />,
    image: dataImg
  },
];

// Testimonials data
const testimonials = [
  {
    name: "Михаил Чен",
    role: "Старший аналитик данных",
    image: "https://avatars.githubusercontent.com/u/1234567?v=4",
    content: "Анализ данных в реальном времени и продвинутые аналитические функции значительно улучшили качество наших отчетов. Меры безопасности платформы дают мне спокойствие."
  },
  {
    name: "Сара Джонсон",
    role: "Руководитель отдела аналитики",
    image: "https://avatars.githubusercontent.com/u/2345678?v=4",
    content: "Инструменты корпоративного уровня ChocoAnalyze изменили нашу аналитическую стратегию. Интеграция API и автоматизированные функции сэкономили нам бесчисленные часы."
  },
  {
    name: "Дэвид Уилсон",
    role: "Аналитик-исследователь",
    image: "https://avatars.githubusercontent.com/u/3456789?v=4",
    content: "Поддержка клиентов исключительная, а интуитивный дизайн платформы сделал начало работы с анализом данных простым. Настоящий прорыв как для новичков, так и для профессионалов."
  },
  {
    name: "Эмили Чжан",
    role: "Data Scientist",
    image: "https://avatars.githubusercontent.com/u/4567890?v=4",
    content: "Мы видим замечательные улучшения в эффективности анализа с момента перехода на ChocoAnalyze. Умная обработка данных и визуализация особенно впечатляют."
  },
  {
    name: "Хэймс Родригес",
    role: "Эксперт по безопасности данных",
    image: "https://avatars.githubusercontent.com/u/5678901?v=4",
    content: "Функции безопасности надежны, а регулярные обновления держат нас впереди новых угроз. Это именно то, что нужно индустрии анализа данных."
  },
  {
    name: "Лиза Томпсон",
    role: "Менеджер по аналитике",
    image: "https://avatars.githubusercontent.com/u/6789012?v=4",
    content: "Способность платформы обрабатывать сложные аналитические задачи, сохраняя простоту интерфейса, замечательна. Это бесценно для управления нашими проектами."
  }
];

// CardSpotlight component
const CardSpotlight = ({ 
  children, 
  className = "" 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) => {
  return (
    <div className={`relative group ${className}`}>
      <div className="absolute -inset-px bg-gradient-to-r from-primary/50 via-transparent to-primary/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative bg-black/50 backdrop-blur-xl rounded-xl border border-white/10 group-hover:border-white/20 transition-all duration-300">
        {children}
      </div>
    </div>
  );
};

// Navigation Component
const Navigation = ({ onStartTrading }: { onStartTrading: () => void }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    if (sectionId === 'testimonials') {
      const testimonialSection = document.querySelector('.animate-marquee');
      if (testimonialSection) {
        const yOffset = -100;
        const y = testimonialSection.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    } else if (sectionId === 'cta') {
      const ctaSection = document.querySelector('.button-gradient');
      if (ctaSection) {
        const yOffset = -100;
        const y = ctaSection.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const navItems = [
    { name: "Функции", href: "#features", onClick: () => scrollToSection('features') },
    { name: "Цены", href: "#pricing", onClick: () => scrollToSection('pricing') },
    { name: "Отзывы", href: "#testimonials", onClick: () => scrollToSection('testimonials') },
  ];

  return (
    <header
      className={`fixed top-3.5 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 rounded-full ${
        isScrolled 
          ? "h-14 bg-[#1B1B1B]/40 backdrop-blur-xl border border-white/10 scale-95 w-[90%] max-w-2xl" 
          : "h-14 bg-[#1B1B1B] w-[95%] max-w-3xl"
      }`}
    >
      <div className="mx-auto h-full px-6">
        <nav className="flex items-center justify-between h-full">
          <div className="flex items-center gap-2">
            <Command className="w-5 h-5 text-primary" />
            <span className="font-bold text-base">Choco<span className="text-gradient">Analyze</span></span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  if (item.onClick) {
                    item.onClick();
                  }
                }}
                className="text-sm text-muted-foreground hover:text-foreground transition-all duration-300"
              >
                {item.name}
              </a>
            ))}
            <Button 
              onClick={onStartTrading}
              size="sm"
              className="button-gradient"
            >
              Начать анализ
            </Button>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="glass">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-[#1B1B1B]">
                <div className="flex flex-col gap-4 mt-8">
                  {navItems.map((item) => (
                    <a
                      key={item.name}
                      href={item.href}
                      className="text-lg text-muted-foreground hover:text-foreground transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsMobileMenuOpen(false);
                        if (item.onClick) {
                          item.onClick();
                        }
                      }}
                    >
                      {item.name}
                    </a>
                  ))}
                  <Button 
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onStartTrading();
                    }}
                    className="button-gradient mt-4"
                  >
                    Начать анализ
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </div>
    </header>
  );
};

// LogoCarousel Component
// const LogoCarousel = () => {
//   const logos = [
//     {freeDomLogo},
//     {freeDomLogo},
//     {freeDomLogo},
//     {freeDomLogo},
//     {freeDomLogo},
//   ];

//   const extendedLogos = [...logos, ...logos, ...logos];

//   return (
//     <div className="w-full overflow-hidden bg-background/50 backdrop-blur-sm py-12 mt-20">
//       <motion.div 
//         className="flex space-x-16"
//         initial={{ opacity: 0, x: "0%" }}
//         animate={{
//           opacity: 1,
//           x: "-50%"
//         }}
//         transition={{
//           opacity: { duration: 0.5 },
//           x: {
//             duration: 15,
//             repeat: Infinity,
//             ease: "linear",
//             delay: 0.5
//           }
//         }}
//         style={{
//           width: "fit-content",
//           display: "flex",
//           gap: "4rem"
//         }}
//       >
//         {extendedLogos.map((logo, index) => (
//           <motion.img
//             key={`logo-${index}`}
//             src={typeof logo === 'string' ? logo : logo.freeDomLogo.src}
//             alt={`Partner logo ${index + 1}`}
//             className="h-8 object-contain"
//             initial={{ opacity: 0.5 }}
//             whileHover={{ 
//               opacity: 1,
//               scale: 1.05,
//               transition: { duration: 0.2 }
//             }}
//           />
//         ))}
//       </motion.div>
//     </div>
//   );
// }; 

// FeatureTab Component
const FeatureTab = ({ icon, title, description, isActive }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  isActive: boolean;
}) => {
  return (
    <div 
      className={`
        w-full flex items-center gap-4 p-5 rounded-xl
        transition-all duration-300 relative
        ${isActive 
          ? 'glass shadow-lg shadow-primary/10' 
          : 'hover:glass-hover'
        }
      `}
    >
      {isActive && (
        <motion.div
          layoutId="activeTab"
          className="absolute left-0 top-0 w-1 h-full bg-primary rounded-l-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}
      <div className="flex items-center gap-4 min-w-0">
        <div className={`${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
          {icon}
        </div>
        <div className="text-left min-w-0">
          <h3 className={`font-semibold truncate text-base ${isActive ? 'text-primary' : ''}`}>
            {title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};

// FeatureContent Component
const FeatureContent = ({ image, title }: { image: string; title: string }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="h-full flex items-center justify-center"
    >
      <div className="glass rounded-xl overflow-hidden w-full relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
        <img
          src={image}
          alt={title}
          className="w-full h-full object-contain relative z-10"
        />
      </div>
    </motion.div>
  );
};

// FeaturesSection Component
const FeaturesSection = () => {
  return (
    <section className="container px-4 py-24">
      {/* Header Section */}
      <div className="max-w-2xl mx-auto text-center mb-20">
        <h2 className="text-5xl md:text-6xl font-normal mb-6 tracking-tight">
          Продвинутые аналитические
          <br />
          <span className="text-gradient font-medium">функции и инструменты</span>
        </h2>
        <p className="text-lg md:text-xl text-gray-400">
          Опыт работы с профессиональными инструментами анализа данных и функциями, разработанными как для новичков, так и для опытных аналитиков.
        </p>
      </div>

      <Tabs defaultValue={features[0].title} className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          {/* Left side - Tab triggers */}
          <div className="md:col-span-5 space-y-3">
            <TabsList className="flex flex-col w-full bg-transparent h-auto p-0 space-y-3">
              {features.map((feature) => (
                <TabsTrigger
                  key={feature.title}
                  value={feature.title}
                  className="w-full data-[state=active]:shadow-none data-[state=active]:bg-transparent"
                >
                  <FeatureTab
                    title={feature.title}
                    description={feature.description}
                    icon={feature.icon}
                    isActive={false}
                  />
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Right side - Tab content with images */}
          <div className="md:col-span-7">
            {features.map((feature) => (
              <TabsContent
                key={feature.title}
                value={feature.title}
                className="mt-0 h-full"
              >
                <FeatureContent
                  image={typeof feature.image === 'string' ? feature.image : feature.image.src}
                  title={feature.title}
                />
              </TabsContent>
            ))}
          </div>
        </div>
      </Tabs>
    </section>
  );
};

// PricingTier Component
const PricingTier = ({
  name,
  price,
  description,
  features,
  isPopular,
  onStartTrading,
}: {
  name: string;
  price: string;
  description: string;
  features: string[];
  isPopular?: boolean;
  onStartTrading: () => void;
}) => (
  <CardSpotlight className={`h-full ${isPopular ? "border-primary" : "border-white/10"} border-2`}>
    <div className="relative h-full p-6 flex flex-col">
      {isPopular && (
        <span className="text-xs font-medium bg-primary/10 text-primary rounded-full px-3 py-1 w-fit mb-4">
          Самый популярный
        </span>
      )}
      <h3 className="text-xl font-medium mb-2">{name}</h3>
      <div className="mb-4">
        <span className="text-4xl font-bold">{price}</span>
        {price !== "По запросу" && price !== "Бесплатно" && <span className="text-gray-400">/месяц</span>}
      </div>
      <p className="text-gray-400 mb-6">{description}</p>
      <ul className="space-y-3 mb-8 flex-grow">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-2">
            <Check className="w-5 h-5 text-primary" />
            <span className="text-sm text-gray-300">{feature}</span>
          </li>
        ))}
      </ul>
      <Button className="button-gradient w-full" onClick={onStartTrading}>
        Начать анализ
      </Button>
    </div>
  </CardSpotlight>
);

// PricingSection Component
const PricingSection = ({ onStartTrading }: { onStartTrading: () => void }) => {
  return (
    <section className="container px-4 py-24">
      <div className="max-w-2xl mx-auto text-center mb-12">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-5xl md:text-6xl font-normal mb-6"
        >
          Выберите свой{" "}
          <span className="text-gradient font-medium">аналитический план</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-lg text-gray-400"
        >
          Выберите идеальный аналитический план с продвинутыми функциями и конкурентными ценами
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <PricingTier
          name="Начинающий аналитик"
          price="Бесплатно"
          description="Идеально для новичков, начинающих свой путь в анализе данных"
          features={[
            "Базовый анализ данных",
            "Простые отчеты и графики",
            "Базовые инструменты визуализации",
            "Поддержка по электронной почте"
          ]}
          onStartTrading={onStartTrading}
        />
        <PricingTier
          name="Про аналитик"
          price="$29"
          description="Продвинутые функции для серьезных аналитиков"
          features={[
            "Продвинутые инструменты анализа",
            "Машинное обучение и ИИ",
            "Продвинутая визуализация данных",
            "Приоритетная поддержка",
            "Доступ к API"
          ]}
          isPopular
          onStartTrading={onStartTrading}
        />
        <PricingTier
          name="Корпоративный"
          price="По запросу"
          description="Корпоративные решения для крупных компаний"
          features={[
            "Индивидуальные аналитические решения",
            "Неограниченный объем данных",
            "Доступ к премиум функциям",
            "Персональный менеджер",
            "Индивидуальная интеграция API",
            "Приоритетная поддержка 24/7"
          ]}
          onStartTrading={onStartTrading}
        />
      </div>
    </section>
  );
};

// TestimonialsSection Component
const TestimonialsSection = () => {
  return (
    <section className="py-20 overflow-hidden bg-black">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl font-normal mb-4">Доверяют аналитики</h2>
          <p className="text-muted-foreground text-lg">
            Присоединяйтесь к тысячам довольных аналитиков на ChocoAnalyze
          </p>
        </motion.div>

        <div className="relative flex flex-col antialiased">
          <div className="relative flex overflow-hidden py-4">
            <div className="animate-marquee flex min-w-full shrink-0 items-stretch gap-8">
              {testimonials.map((testimonial, index) => (
                <Card key={`${index}-1`} className="w-[400px] shrink-0 bg-black/40 backdrop-blur-xl border-white/5 hover:border-white/10 transition-all duration-300 p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={testimonial.image} />
                      <AvatarFallback>{testimonial.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium text-white/90">{testimonial.name}</h4>
                      <p className="text-sm text-white/60">{testimonial.role}</p>
                    </div>
                  </div>
                  <p className="text-white/70 leading-relaxed">
                    {testimonial.content}
                  </p>
                </Card>
              ))}
            </div>
            <div className="animate-marquee flex min-w-full shrink-0 items-stretch gap-8">
              {testimonials.map((testimonial, index) => (
                <Card key={`${index}-2`} className="w-[400px] shrink-0 bg-black/40 backdrop-blur-xl border-white/5 hover:border-white/10 transition-all duration-300 p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={testimonial.image} />
                      <AvatarFallback>{testimonial.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium text-white/90">{testimonial.name}</h4>
                      <p className="text-sm text-white/60">{testimonial.role}</p>
                    </div>
                  </div>
                  <p className="text-white/70 leading-relaxed">
                    {testimonial.content}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Footer Component
const Footer = () => {
  return (
    <footer className="w-full py-12 mt-20">
      <div className="container px-4">
        <div className="glass glass-hover rounded-xl p-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <h3 className="font-medium text-lg">CryptoTrade</h3>
              <p className="text-sm text-muted-foreground">
                Предоставляем аналитикам продвинутые решения для анализа данных.
              </p>
              <div className="flex space-x-4">
                <Button variant="ghost" size="icon">
                  <Twitter className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Github className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Аналитика</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#features" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Инструменты
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Тарифы
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Ресурсы</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Руководство по анализу
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Примеры отчетов
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Правовая информация</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Политика конфиденциальности
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Условия обслуживания
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-white/10">
            <p className="text-sm text-muted-foreground text-center">
              © {new Date().getFullYear()} Rezaul Arif. Все права защищены.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

// Main Landing Component
const Landing = () => {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const handleStartTrading = () => {
    if (isAuthenticated) {
      // If user is already authenticated, go directly to chat
      router.push('/chat');
    } else {
      // If not authenticated, show auth modal
      setIsAuthOpen(true);
    }
  };

  const handleCloseAuth = () => {
    setIsAuthOpen(false);
  };

  return (
    <div className="min-h-screen bg-black text-foreground">
      <Navigation onStartTrading={handleStartTrading} />
      
      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative container px-4 pt-40 pb-20"
      >
        {/* Background */}
        <div 
          className="absolute inset-0 -z-10 bg-[#0A0A0A]"
        />
        
        <div className="flex justify-center mb-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-block px-4 py-1.5 rounded-full glass"
          >
            <span className="text-sm font-medium">
              <Command className="w-4 h-4 inline-block mr-2" />
              Платформа анализа данных нового поколения
            </span>
          </motion.div>
        </div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-7xl font-normal mb-4 tracking-tight">
            <span className="text-gray-200">
              Будущее
            </span>
            <br />
            <span className="text-white font-medium">
              Анализа Данных
            </span>
          </h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl mx-auto"
          >
            Опыт беспрепятственного анализа данных с продвинутыми функциями, аналитикой в реальном времени и безопасностью институционального уровня.{" "}
            <span className="text-white">Начните анализировать за минуты.</span>
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button size="lg" className="button-gradient" onClick={handleStartTrading}>
              Начать анализ
            </Button>
            <Button size="lg" variant="link" className="text-white">
              Посмотреть отчеты <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="relative mx-auto max-w-5xl mt-20"
        >
          <div className="glass rounded-xl overflow-hidden">
            <img
              src={heroImg.src}
              alt="CryptoTrade Dashboard"
              className="w-full h-auto"
            />
          </div>
        </motion.div>
      </motion.section>
    
      {/* Logo Carousel */}
      {/* <LogoCarousel /> */}

      {/* Features Section */}
      <div id="features" className="bg-black">
        <FeaturesSection />
      </div>

      {/* Pricing Section */}
      <div id="pricing" className="bg-black">
        <PricingSection onStartTrading={handleStartTrading} />
      </div>

      {/* Testimonials Section */}
      <div className="bg-black">
        <TestimonialsSection />
      </div>

      {/* CTA Section */}
      <section className="container px-4 py-20 relative bg-black">
        <div 
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: 'url("/lovable-uploads/21f3edfb-62b5-4e35-9d03-7339d803b980.png")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-[#0A0A0A]/80 backdrop-blur-lg border border-white/10 rounded-2xl p-8 md:p-12 text-center relative z-10"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Готовы начать анализ?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Присоединяйтесь к тысячам аналитиков, которые уже открыли для себя мощь нашей платформы.
          </p>
          <Button size="lg" className="button-gradient" onClick={handleStartTrading}>
            Создать аккаунт
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <div className="bg-black">
        <Footer />
      </div>
      
      {/* Auth Modal */}
      <Auth isOpen={isAuthOpen} onClose={handleCloseAuth} />
    </div>
  );
};

export default Landing;