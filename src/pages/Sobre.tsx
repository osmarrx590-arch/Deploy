
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Beer, Award, Clock, Users } from 'lucide-react';
//import { Calendar, Clock, Award, Droplet, User, Truck } from 'lucide-react';

const Sobre = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Timeline data
  const timeline = [
    {
      year: "2010",
      title: "Fundação",
      description: "Nascemos como um pequeno hobby que se transformou em uma paixão por criar cervejas especiais."
    },
    {
      year: "2012",
      title: "Primeira Fábrica",
      description: "Inauguramos nossa primeira fábrica com capacidade para produção de 5.000 litros mensais."
    },
    {
      year: "2015",
      title: "Expansão",
      description: "Ampliamos nossa capacidade produtiva e começamos a distribuir para toda a região."
    },
    {
      year: "2018",
      title: "Premiação",
      description: "Recebemos nosso primeiro prêmio internacional, destacando nossa IPA Tropical."
    },
    {
      year: "2021",
      title: "Novo Espaço",
      description: "Inauguramos nosso brewpub, um espaço para os amantes de cerveja degustarem nossas criações."
    }
  ];

  // Team members
  const team = [
    {
      name: "Carlos Ferreira",
      role: "Mestre Cervejeiro",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1974&auto=format&fit=crop",
      description: "Com 15 anos de experiência, Carlos lidera nosso processo de produção com maestria e paixão."
    },
    {
      name: "Ana Oliveira",
      role: "Sommelier de Cervejas",
      image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=1961&auto=format&fit=crop",
      description: "Especialista em harmonização, Ana ajuda a criar experiências sensoriais únicas com nossas cervejas."
    },
    {
      name: "Ricardo Santos",
      role: "Chefe de Inovação",
      image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1974&auto=format&fit=crop",
      description: "Responsável por criar novas receitas e buscar ingredientes especiais para nossas cervejas sazonais."
    }
  ];

  return (
    <div className="bg-brewery-cream pt-16">
      {/*Seção de Heróis */}
      <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 z-0">
          <div className="relative w-full h-full">
            <div className="absolute inset-0 bg-brewery-dark/70 z-10"></div>
            <img 
              src="https://images.unsplash.com/photo-1559526324-593bc073d938?q=80&w=2070&auto=format&fit=crop" 
              alt="Choperia - Nossa História" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        {/*alt="Choperia - Nossa História"*/}
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl md:text-5xl font-brewery font-bold text-white mb-4"
            >
              Nossa História
            </motion.h1>
            <motion.div 
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "80px" }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="h-1 bg-brewery-amber mx-auto mb-6"
            ></motion.div>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-brewery-cream/90 text-lg"
            >
              Conheça a trajetória da nossa cervejaria, nossa paixão pela arte cervejeira e as pessoas por trás das nossas criações.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Seção de História */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <img 
                src="https://images.unsplash.com/photo-1505075106905-fb052892c116?q=80&w=2070&auto=format&fit=crop" 
                alt="Fundação da Choperia" 
                className="rounded-lg shadow-lg w-full h-auto"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-brewery-amber font-medium mb-2 block">Nossa Jornada</span>
              <h2 className="text-3xl font-brewery font-bold text-brewery-dark mb-6">Uma história de paixão pela cerveja</h2>
              <div className="h-1 w-20 bg-brewery-amber mb-6"></div>
              <p className="text-brewery-dark/80 mb-4">
                Fundada em 2010, a Choperia nasceu da paixão de um grupo de amigos que compartilhavam não apenas o amor por cervejas de qualidade, mas também o sonho de criar receitas únicas que expressassem o verdadeiro caráter da cerveja artesanal brasileira.
              </p>
              <p className="text-brewery-dark/80 mb-4">
                O que começou como experimentos caseiros em um pequeno galpão se transformou em uma cervejaria reconhecida nacionalmente pela qualidade, inovação e respeito às tradições cervejeiras.
              </p>
              <p className="text-brewery-dark/80">
                Hoje, contamos com uma equipe dedicada de mestres cervejeiros que combinam técnicas tradicionais europeias com ingredientes brasileiros para criar cervejas verdadeiramente especiais.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Seção de Valores */}
      <section className="py-16 bg-brewery-cream">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-3xl md:text-4xl font-brewery font-bold text-brewery-dark mb-4"
            >
              Nossos Valores
            </motion.h2>
            <motion.div 
              initial={{ opacity: 0, width: 0 }}
              whileInView={{ opacity: 1, width: "80px" }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="h-1 bg-brewery-amber mx-auto mb-6"
            ></motion.div>
            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-brewery-dark/70 max-w-2xl mx-auto"
            >
              O que nos guia diariamente na busca pela excelência em tudo o que fazemos.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-white p-8 rounded-lg shadow-md text-center"
            >
              <div className="w-16 h-16 mx-auto bg-brewery-amber rounded-full flex items-center justify-center mb-6">
                <Beer size={28} className="text-white" />
              </div>
              <h3 className="text-xl font-brewery font-bold text-brewery-dark mb-3">Qualidade</h3>
              <p className="text-brewery-dark/70">
                Comprometidos com a excelência em cada etapa do processo, da seleção dos ingredientes ao produto final.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white p-8 rounded-lg shadow-md text-center"
            >
              <div className="w-16 h-16 mx-auto bg-brewery-amber rounded-full flex items-center justify-center mb-6">
                <Award size={28} className="text-white" />
              </div>
              <h3 className="text-xl font-brewery font-bold text-brewery-dark mb-3">Autenticidade</h3>
              <p className="text-brewery-dark/70">
                Criamos cervejas que refletem nossa paixão e personalidade, sempre fiéis às nossas raízes e valores.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white p-8 rounded-lg shadow-md text-center"
            >
              <div className="w-16 h-16 mx-auto bg-brewery-amber rounded-full flex items-center justify-center mb-6">
                <Clock size={28} className="text-white" />
              </div>
              <h3 className="text-xl font-brewery font-bold text-brewery-dark mb-3">Tradição</h3>
              <p className="text-brewery-dark/70">
                Respeitamos as técnicas cervejeiras tradicionais, enquanto buscamos constantemente a inovação.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white p-8 rounded-lg shadow-md text-center"
            >
              <div className="w-16 h-16 mx-auto bg-brewery-amber rounded-full flex items-center justify-center mb-6">
                <Users size={28} className="text-white" />
              </div>
              <h3 className="text-xl font-brewery font-bold text-brewery-dark mb-3">Comunidade</h3>
              <p className="text-brewery-dark/70">
                Acreditamos no poder da cerveja de unir pessoas e criar momentos inesquecíveis de celebração.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trajetória Section */}
      <section className="bg-brewery-brown container mx-auto px-4 mb-20">
        <div className="text-center mb-12">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-brewery font-bold text-white mb-4"
          >
            Nossa Trajetória
          </motion.h2>
          <motion.div 
            initial={{ opacity: 0, width: 0 }}
            whileInView={{ opacity: 1, width: "80px" }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="h-1 bg-brewery-amber mx-auto mb-6"
          ></motion.div>
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-brewery-cream/80 max-w-2xl mx-auto"
          >
            Os marcos importantes da nossa história desde o início até hoje.
          </motion.p>
        </div>

        <div className="relative">
          {/* Trajetória line */}
          <div className="absolute left-0 md:left-1/2 transform md:-translate-x-1/2 h-full w-1 bg-brewery-amber/30"></div>

          <div className="space-y-12">
            {timeline.map((item, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative flex flex-col md:flex-row ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}
              >
                <div className="flex-1"></div>
                <div className="absolute left-0 md:left-1/2 transform -translate-x-1/2 -translate-y-3 w-7 h-7 rounded-full bg-brewery-amber z-10 flex items-center justify-center">
                  <Calendar size={16} className="text-white" />
                </div>
                <div className={`flex-1 md:px-12 ${index % 2 === 0 ? 'md:text-right md:pr-12 md:pl-0' : 'md:pl-12 md:pr-0'}`}>
                  <div className="bg-white p-6 rounded-xl shadow-md">
                    <span className="inline-block bg-brewery-amber/10 text-brewery-amber text-sm font-medium px-3 py-1 rounded-full mb-2">
                      {item.year}
                    </span>
                    <h3 className="text-xl font-brewery font-bold text-brewery-dark mb-2">{item.title}</h3>
                    <p className="text-brewery-dark/70">{item.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* Seção de equipe */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-3xl md:text-4xl font-brewery font-bold text-brewery-dark mb-4"
            >
              Nossa Equipe
            </motion.h2>
            <motion.div 
              initial={{ opacity: 0, width: 0 }}
              whileInView={{ opacity: 1, width: "80px" }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="h-1 bg-brewery-amber mx-auto mb-6"
            ></motion.div>
            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-brewery-dark/70 max-w-2xl mx-auto"
            >
              Conheça os apaixonados por cerveja que fazem a Choperia acontecer todos os dias.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Membro da equipe 1 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-brewery-cream rounded-lg overflow-hidden shadow-md"
            >
              <img 
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2070&auto=format&fit=crop" 
                alt="Mestre Cervejeiro" 
                className="w-full h-72 object-cover"
              />
              <div className="p-6">
                <h3 className="text-xl font-brewery font-bold text-brewery-dark mb-1">Carlos Oliveira</h3>
                <p className="text-brewery-amber font-medium mb-3">Mestre Cervejeiro</p>
                <p className="text-brewery-dark/70">
                  Com mais de 15 anos de experiência, Carlos traz sua expertise da Alemanha e Bélgica para criar nossas receitas premiadas.
                </p>
              </div>
            </motion.div>

            {/* Membro da equipe 2 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-brewery-cream rounded-lg overflow-hidden shadow-md"
            >
              <img 
                src="https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=1961&auto=format&fit=crop" 
                alt="Sommelier de Cervejas" 
                className="w-full h-72 object-cover"
              />
              <div className="p-6">
                <h3 className="text-xl font-brewery font-bold text-brewery-dark mb-1">Ana Silva</h3>
                <p className="text-brewery-amber font-medium mb-3">Sommelier de Cervejas</p>
                <p className="text-brewery-dark/70">
                  Especialista em harmonização, Ana é responsável por criar experiências gastronômicas únicas com nossas cervejas.
                </p>
              </div>
            </motion.div>

            {/* Membro da equipe 3 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-brewery-cream rounded-lg overflow-hidden shadow-md"
            >
              <img 
                src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=1974&auto=format&fit=crop" 
                alt="Diretor Criativo" 
                className="w-full h-72 object-cover"
              />
              <div className="p-6">
                <h3 className="text-xl font-brewery font-bold text-brewery-dark mb-1">Rafael Mendes</h3>
                <p className="text-brewery-amber font-medium mb-3">Diretor Criativo</p>
                <p className="text-brewery-dark/70">
                  Mente criativa por trás das nossas campanhas e rótulos, Rafael trabalha para que cada cerveja conte uma história única.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-brewery-brown">
        <div className="container mx-auto px-4 text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-brewery font-bold text-white mb-6"
          >
            Faça Parte da Nossa História
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-white/80 mb-8 max-w-2xl mx-auto"
          >
            Visite nossa cervejaria, participe de degustações ou apenas venha tomar uma cerveja com a gente. Estamos sempre de portas Ocupadas para os amantes de boa cerveja.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row justify-center gap-4"
          >
            <a href="/contato" className="btn-primary">Entre em Contato</a>
            <a href="/menu" className="btn-outline">Ver Nossos Produtos</a>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Sobre;
