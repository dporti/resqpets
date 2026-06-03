import { createContext, useContext, useState, ReactNode } from 'react';

interface AnimalRef { id: number; nombre: string; }

interface AnimalListContextType {
  list: AnimalRef[];
  setList: (list: AnimalRef[]) => void;
  prevId: (currentId: number) => number | null;
  nextId: (currentId: number) => number | null;
}

const AnimalListContext = createContext<AnimalListContextType | null>(null);

export function AnimalListProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<AnimalRef[]>([]);

  const prevId = (currentId: number) => {
    const idx = list.findIndex(a => a.id === currentId);
    return idx > 0 ? list[idx - 1].id : null;
  };

  const nextId = (currentId: number) => {
    const idx = list.findIndex(a => a.id === currentId);
    return idx >= 0 && idx < list.length - 1 ? list[idx + 1].id : null;
  };

  return (
    <AnimalListContext.Provider value={{ list, setList, prevId, nextId }}>
      {children}
    </AnimalListContext.Provider>
  );
}

export function useAnimalList() {
  const ctx = useContext(AnimalListContext);
  if (!ctx) throw new Error('useAnimalList must be used within AnimalListProvider');
  return ctx;
}
