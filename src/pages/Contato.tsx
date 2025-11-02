//src\pages\Contato.tsx
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle } from 'lucide-react';

const Contato = () => {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formState.name.trim()) newErrors.name = 'Nome é obrigatório';
    if (!formState.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formState.email)) {
      newErrors.email = 'Email inválido';
    }
    if (!formState.message.trim()) newErrors.message = 'Mensagem é obrigatória';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSubmitting(true);
      
      // Simulate API call with timeout
      setTimeout(() => {
        setIsSubmitting(false);
        setIsSubmitted(true);
        setFormState({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: ''
        });
        
        // Reset success message after 5 seconds
        setTimeout(() => {
          setIsSubmitted(false);
        }, 5000);
      }, 1500);
    }
  };

  return (
    <div className="bg-brewery-cream pt-24 pb-16">
      {/* Hero Section */}
      <section className="relative py-20 mb-12">
        <div className="absolute inset-0 z-0">
          <div className="relative w-full h-full">
            <div className="absolute inset-0 bg-brewery-dark/70 z-10"></div>
            <img 
              src="https://images.unsplash.com/photo-1608270586620-248524c67de9?q=80&w=2070&auto=format&fit=crop" 
              alt="Contato" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl md:text-5xl font-brewery font-bold text-white mb-4"
            >
              Entre em Contato
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
              Estamos aqui para ouvir suas dúvidas, sugestões ou pedidos. Entre em contato conosco hoje mesmo!
            </motion.p>
          </div>
        </div>
      </section>

      {/* Contact Info & Form Section */}
      <section className="container mx-auto px-4 mb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            <div>
              <h2 className="text-3xl font-brewery font-bold text-brewery-dark mb-6">Informações de Contato</h2>
              <p className="text-brewery-dark/80 mb-8">
                Ficaremos felizes em ouvir você! Seja para uma dúvida, feedback, agendamento de visita ou encomenda, estamos à disposição para atendê-lo.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="bg-brewery-amber w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin size={22} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-brewery font-semibold text-brewery-dark mb-1">Endereço</h3>
                  <p className="text-brewery-dark/70">Rua das Cervejas, 123, Bairro Pilsen</p>
                  <p className="text-brewery-dark/70">São Paulo - SP, 01234-567</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-brewery-amber w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                  <Phone size={22} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-brewery font-semibold text-brewery-dark mb-1">Telefone</h3>
                  <p className="text-brewery-dark/70">(11) 99999-9999</p>
                  <p className="text-brewery-dark/70">(11) 5555-5555</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-brewery-amber w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail size={22} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-brewery font-semibold text-brewery-dark mb-1">Email</h3>
                  <p className="text-brewery-dark/70">contato@cervejaria.com.br</p>
                  <p className="text-brewery-dark/70">vendas@cervejaria.com.br</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-brewery-amber w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock size={22} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-brewery font-semibold text-brewery-dark mb-1">Horário de Funcionamento</h3>
                  <p className="text-brewery-dark/70">Segunda a Sexta: 10h às 18h</p>
                  <p className="text-brewery-dark/70">Sábado: 12h às 20h</p>
                  <p className="text-brewery-dark/70">Domingo: Fechado</p>
                </div>
              </div>
            </div>

            {/* Google Map */}
            <div className="bg-brewery-dark/5 h-64 rounded-xl overflow-hidden">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3657.1973526535873!2d-46.65819742392132!3d-23.56518006120809!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94ce59c8e702be3b%3A0x4d67ae7e5b21e317!2sAv.%20Paulista%2C%20S%C3%A3o%20Paulo%20-%20SP!5e0!3m2!1spt-BR!2sbr!4v1691532750243!5m2!1spt-BR!2sbr" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-brewery font-bold text-brewery-dark mb-6">Envie sua Mensagem</h2>
              
              {isSubmitted ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 flex items-center">
                  <CheckCircle size={24} className="text-green-500 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-green-800 mb-1">Mensagem enviada com sucesso!</h3>
                    <p className="text-green-700">Agradecemos seu contato. Retornaremos em breve.</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="name" className="block text-brewery-dark/80 mb-1">Nome *</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formState.name}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border ${errors.name ? 'border-red-500' : 'border-brewery-brown/20'} rounded-lg focus:outline-none focus:ring-2 focus:ring-brewery-amber/50`}
                        placeholder="Seu nome"
                      />
                      {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-brewery-dark/80 mb-1">Email *</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formState.email}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border ${errors.email ? 'border-red-500' : 'border-brewery-brown/20'} rounded-lg focus:outline-none focus:ring-2 focus:ring-brewery-amber/50`}
                        placeholder="Seu email"
                      />
                      {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="phone" className="block text-brewery-dark/80 mb-1">Telefone</label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formState.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-brewery-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-brewery-amber/50"
                        placeholder="Seu telefone"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="subject" className="block text-brewery-dark/80 mb-1">Assunto</label>
                      <select
                        id="subject"
                        name="subject"
                        value={formState.subject}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-brewery-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-brewery-amber/50 appearance-none bg-white"
                      >
                        <option value="">Selecione um assunto</option>
                        <option value="info">Informações</option>
                        <option value="order">Encomenda</option>
                        <option value="visit">Agendar Visita</option>
                        <option value="feedback">Feedback</option>
                        <option value="other">Outro</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="message" className="block text-brewery-dark/80 mb-1">Mensagem *</label>
                    <textarea
                      id="message"
                      name="message"
                      value={formState.message}
                      onChange={handleChange}
                      rows={6}
                      className={`w-full px-4 py-3 border ${errors.message ? 'border-red-500' : 'border-brewery-brown/20'} rounded-lg focus:outline-none focus:ring-2 focus:ring-brewery-amber/50`}
                      placeholder="Sua mensagem"
                    ></textarea>
                    {errors.message && <p className="text-red-500 text-sm mt-1">{errors.message}</p>}
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`btn-primary w-full flex items-center justify-center ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send size={18} className="mr-2" />
                        Enviar Mensagem
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 mb-12">
        <div className="text-center mb-12">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-brewery font-bold text-brewery-dark mb-4"
          >
            Perguntas Frequentes
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
            Encontre respostas para as dúvidas mais comuns sobre nossa cervejaria e produtos.
          </motion.p>
        </div>

        <div className="max-w-3xl mx-auto">
          {[
            {
              question: "Como posso visitar a cervejaria?",
              answer: "Você pode agendar uma visita guiada através do nosso formulário de contato ou ligando para nosso número. As visitas acontecem às sextas e sábados, com horários às 14h e 16h."
            },
            {
              question: "Vocês vendem para todo o Brasil?",
              answer: "Sim, realizamos entregas para todo o território nacional. O prazo de entrega varia conforme a região, e os custos de frete são calculados no checkout."
            },
            {
              question: "É possível comprar diretamente na fábrica?",
              answer: "Sim, temos uma loja física anexa à fábrica onde você pode adquirir nossas cervejas e produtos exclusivos. Nosso horário de funcionamento é de segunda a sexta, das 10h às 18h, e sábados, das 12h às 20h."
            },
            {
              question: "Vocês produzem cervejas sazonais?",
              answer: "Sim, além da nossa linha permanente, lançamos cervejas sazonais algumas vezes ao ano, aproveitando ingredientes da estação e criando receitas especiais para cada momento."
            },
            {
              question: "Como posso me tornar um revendedor?",
              answer: "Para se tornar um revendedor oficial, entre em contato através do email comercial@cervejaria.com.br com o assunto 'Revenda' e envie as informações do seu estabelecimento. Nossa equipe entrará em contato."
            }
          ].map((faq, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="mb-5"
            >
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer p-6">
                    <h3 className="text-lg font-brewery font-semibold text-brewery-dark">{faq.question}</h3>
                    <span className="ml-2 text-brewery-amber transition-transform duration-300 group-open:rotate-180">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  </summary>
                  <div className="px-6 pb-6 pt-0">
                    <p className="text-brewery-dark/70">{faq.answer}</p>
                  </div>
                </details>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Contato;
