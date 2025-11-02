
import { Beer, Mail, MapPin, Phone, Facebook, Instagram, Twitter } from 'lucide-react';
import { Link } from 'react-router-dom';

// Rodapé padrão do site, com informações de marca, navegação, contato e horários
const Footer = () => {
  return (
    <footer className="bg-brewery-dark text-white pt-12 pb-6">
      <div className="container mx-auto px-4 md:px-6">
        {/* Grid responsivo para seções do rodapé */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Seção da Marca */}
          <div>
            <div className="flex items-center mb-4">
              <Beer className="h-8 w-8 text-brewery-amber mr-2" />
              <span className="text-xl font-brewery font-bold">Choperia</span>
            </div>
            <p className="text-gray-300 mb-4">
              A melhor experiência em cervejas artesanais da região, com tradição e qualidade desde 2010.
            </p>
            {/* Ícones de Redes Sociais */}
            <div className="flex space-x-4">
              <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook" 
                 className="text-gray-300 hover:text-brewery-amber transition-colors duration-300">
                <Facebook size={20} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram"
                 className="text-gray-300 hover:text-brewery-amber transition-colors duration-300">
                <Instagram size={20} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter"
                 className="text-gray-300 hover:text-brewery-amber transition-colors duration-300">
                <Twitter size={20} />
              </a>
            </div>
          </div>

          {/* Links de Navegação */}
          <div>
            <h3 className="text-lg font-bold mb-4">Navegação</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-300 hover:text-brewery-amber transition-colors duration-300">
                  Início
                </Link>
              </li>
              <li>
                <Link to="/menu" className="text-gray-300 hover:text-brewery-amber transition-colors duration-300">
                  Menu
                </Link>
              </li>
              <li>
                <Link to="/sobre" className="text-gray-300 hover:text-brewery-amber transition-colors duration-300">
                  Sobre Nós
                </Link>
              </li>
              <li>
                <Link to="/contato" className="text-gray-300 hover:text-brewery-amber transition-colors duration-300">
                  Contato
                </Link>
              </li>
            </ul>
          </div>

          {/* Informações de Contato */}
          <div>
            <h3 className="text-lg font-bold mb-4">Contato</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <MapPin className="h-5 w-5 text-brewery-amber mr-2 mt-0.5" />
                <span className="text-gray-300">
                  Rua das Cervejas, 123<br />
                  Bairro Centro<br />
                  São Paulo - SP
                </span>
              </li>
              <li className="flex items-center">
                <Phone className="h-5 w-5 text-brewery-amber mr-2" />
                <a href="tel:+551199999999" className="text-gray-300 hover:text-brewery-amber transition-colors duration-300">
                  (11) 9999-9999
                </a>
              </li>
              <li className="flex items-center">
                <Mail className="h-5 w-5 text-brewery-amber mr-2" />
                <a href="mailto:contato@choperia.com.br" className="text-gray-300 hover:text-brewery-amber transition-colors duration-300">
                  contato@choperia.com.br
                </a>
              </li>
            </ul>
          </div>

          {/* Horário de Funcionamento */}
          <div>
            <h3 className="text-lg font-bold mb-4">Horário de Funcionamento</h3>
            <ul className="space-y-2">
              <li className="text-gray-300">
                <span className="font-medium">Segunda a Quinta:</span><br />
                12h às 23h
              </li>
              <li className="text-gray-300">
                <span className="font-medium">Sexta e Sábado:</span><br />
                12h às 02h
              </li>
              <li className="text-gray-300">
                <span className="font-medium">Domingo:</span><br />
                12h às 22h
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright e Política/Termos */}
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} Choperia. Todos os direitos reservados.</p>
          <p className="mt-2">
            <Link to="/politica-de-privacidade" className="hover:text-brewery-amber transition-colors duration-300">
              Política de Privacidade
            </Link>{' '}
            |{' '}
            <Link to="/termos-de-uso" className="hover:text-brewery-amber transition-colors duration-300">
              Termos de Uso
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

