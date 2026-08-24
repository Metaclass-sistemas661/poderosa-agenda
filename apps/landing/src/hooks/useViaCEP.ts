import { useState } from 'react';

export type ViaCEPResult = {
  zip_code: string;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  isGeneral: boolean; // if true, address/neighborhood were empty in ViaCEP
};

export function useViaCEP() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 8);
    return numbers.replace(/(\d{5})(\d)/, '$1-$2');
  };

  const fetchCep = async (cep: string): Promise<ViaCEPResult | null> => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return null;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();

      if (data.erro) {
        setError('CEP não encontrado');
        return null;
      }

      return {
        zip_code: data.cep,
        address: data.logradouro || '',
        neighborhood: data.bairro || '',
        city: data.localidade || '',
        state: data.uf || '',
        isGeneral: !data.logradouro // General CEPs return empty logradouro
      };
    } catch (e) {
      setError('Erro ao buscar CEP');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { fetchCep, formatCEP, isLoading, error, setError };
}
