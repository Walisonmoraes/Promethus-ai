"""
Script para scraping de notas fiscais da SEFAZ-MT usando Playwright
Autor: Sistema Prometheus AI
Data: 2026
"""

from playwright.sync_api import sync_playwright
import json
import time
import sys
import argparse
from datetime import datetime
from typing import List, Dict, Optional
import os

class SefazMTScraper:
    """Classe para scraping de notas fiscais da SEFAZ-MT"""
    
    def __init__(self, headless: bool = True):
        self.headless = headless
        self.base_url = "https://www.sefaz.mt.gov.br/notamt/nota/lista/5/2026"
        self.browser = None
        self.page = None
        
    def start(self):
        """Inicia o navegador Playwright"""
        self.playwright = sync_playwright().start()
        self.browser = self.playwright.chromium.launch(headless=self.headless)
        self.page = self.browser.new_page()
        
    def close(self):
        """Fecha o navegador"""
        if self.browser:
            self.browser.close()
        if self.playwright:
            self.playwright.stop()
            
    def login(self, cpf: str, senha: str) -> bool:
        """
        Realiza login no site da SEFAZ-MT usando CPF e senha
        
        Args:
            cpf: CPF do usuário (apenas números)
            senha: Senha do usuário
            
        Returns:
            bool: True se login bem-sucedido, False caso contrário
        """
        try:
            self.page.goto(self.base_url, wait_until="networkidle")
            
            # Aguarda carregamento da página
            time.sleep(2)
            
            # Procura campo de CPF
            cpf_input = self.page.query_selector('input[name*="cpf"]') or self.page.query_selector('input[id*="cpf"]')
            
            if not cpf_input:
                print("Campo de CPF não encontrado")
                return False
                
            # Preenche CPF
            cpf_input.fill(cpf)
            
            # Procura campo de senha
            senha_input = (self.page.query_selector('input[name*="senha"]') or 
                          self.page.query_selector('input[name*="password"]') or
                          self.page.query_selector('input[type="password"]'))
            
            if senha_input:
                senha_input.fill(senha)
                print("Senha preenchida")
            else:
                print("Campo de senha não encontrado, tentando sem senha")
            
            # Procura botão de login/consulta
            login_button = self.page.query_selector('button[type="submit"]') or self.page.query_selector('input[type="submit"]')
            
            if not login_button:
                print("Botão de login não encontrado")
                return False
                
            # Clica no botão
            login_button.click()
            
            # Aguarda processamento
            time.sleep(3)
            
            # Verifica se login foi bem-sucedido (redirecionamento ou mudança na página)
            current_url = self.page.url
            if "login" not in current_url.lower() and "erro" not in current_url.lower():
                print("Login realizado com sucesso")
                return True
            else:
                print("Login falhou")
                return False
                
        except Exception as e:
            print(f"Erro durante login: {e}")
            return False
            
    def extract_notas(self) -> List[Dict]:
        """
        Extrai dados das notas fiscais da página
        
        Returns:
            List[Dict]: Lista de notas fiscais com dados extraídos
        """
        notas = []
        
        try:
            # Aguarda carregamento da lista de notas
            time.sleep(2)
            
            # Procura tabela ou lista de notas
            # A estrutura pode variar, então precisamos adaptar
            table = self.page.query_selector('table')
            
            if not table:
                print("Tabela de notas não encontrada")
                return notas
                
            # Extrai linhas da tabela
            rows = table.query_selector_all('tr')
            
            for row in rows[1:]:  # Pula cabeçalho
                cells = row.query_selector_all('td')
                
                if len(cells) < 3:
                    continue
                    
                nota = {
                    'data': cells[0].inner_text().strip() if cells[0] else '',
                    'numero': cells[1].inner_text().strip() if cells[1] else '',
                    'valor': cells[2].inner_text().strip() if cells[2] else '',
                    'cnpj': cells[3].inner_text().strip() if len(cells) > 3 else '',
                    'empresa': cells[4].inner_text().strip() if len(cells) > 4 else '',
                    'data_extracao': datetime.now().isoformat()
                }
                
                notas.append(nota)
                
            print(f"Extraídas {len(notas)} notas fiscais")
            return notas
            
        except Exception as e:
            print(f"Erro ao extrair notas: {e}")
            return notas
            
    def navigate_to_month(self, month: int, year: int = 2026) -> bool:
        """
        Navega para um mês específico
        
        Args:
            month: Mês (1-12)
            year: Ano
            
        Returns:
            bool: True se navegação bem-sucedida
        """
        try:
            # URL para mês específico
            url = f"https://www.sefaz.mt.gov.br/notamt/nota/lista/{month}/{year}"
            self.page.goto(url, wait_until="networkidle")
            time.sleep(2)
            return True
        except Exception as e:
            print(f"Erro ao navegar para mês: {e}")
            return False
            
    def scrape_all_months(self, cpf: str, senha: str, start_month: int = 1, end_month: int = 12, year: int = 2026) -> List[Dict]:
        """
        Scraping de todos os meses de um ano
        
        Args:
            cpf: CPF do usuário
            senha: Senha do usuário
            start_month: Mês inicial
            end_month: Mês final
            year: Ano
            
        Returns:
            List[Dict]: Lista completa de notas fiscais
        """
        all_notas = []
        
        if not self.login(cpf, senha):
            return all_notas
            
        for month in range(start_month, end_month + 1):
            print(f"Scraping mês {month}/{year}...")
            
            if self.navigate_to_month(month, year):
                notas = self.extract_notas()
                all_notas.extend(notas)
                
            time.sleep(1)  # Delay entre requisições
            
        return all_notas
        
    def save_to_json(self, notas: List[Dict], filename: str = "notas_fiscais.json"):
        """Salva notas em arquivo JSON"""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(notas, f, ensure_ascii=False, indent=2)
        print(f"Notas salvas em {filename}")


def main():
    """Função principal para teste"""
    parser = argparse.ArgumentParser(description='Scraping de notas fiscais da SEFAZ-MT')
    parser.add_argument('--cpf', type=str, required=True, help='CPF do usuário (apenas números)')
    parser.add_argument('--senha', type=str, required=False, help='Senha do usuário')
    parser.add_argument('--month', type=int, help='Mês específico (1-12)')
    parser.add_argument('--year', type=int, default=2026, help='Ano (padrão: 2026)')
    parser.add_argument('--headless', action='store_true', help='Executar em modo headless')
    parser.add_argument('--output', type=str, default='notas_fiscais.json', help='Arquivo de saída JSON')
    
    args = parser.parse_args()

    senha = args.senha or os.getenv('SEFAZ_MT_SENHA') or os.getenv('SEFAZ_SENHA')
    if not senha:
        print(json.dumps({"error": "Senha não informada"}), file=sys.stderr)
        sys.exit(1)
    
    scraper = SefazMTScraper(headless=args.headless)
    
    try:
        scraper.start()
        
        # Scraping de um mês específico ou todos os meses
        if args.month:
            print(f"Scraping mês {args.month}/{args.year}...")
            if scraper.login(args.cpf, senha):
                if scraper.navigate_to_month(args.month, args.year):
                    notas = scraper.extract_notas()
                    scraper.save_to_json(notas, args.output)
                    print(json.dumps(notas, ensure_ascii=False, indent=2))
        else:
            print(f"Scraping todos os meses de {args.year}...")
            notas = scraper.scrape_all_months(args.cpf, senha, start_month=1, end_month=12, year=args.year)
            scraper.save_to_json(notas, args.output)
            print(json.dumps(notas, ensure_ascii=False, indent=2))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)
    finally:
        scraper.close()


if __name__ == "__main__":
    main()
