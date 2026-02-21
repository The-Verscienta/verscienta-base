import { renderHook, act } from '@testing-library/react';
import { useFavorites } from '@/hooks/useFavorites';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: jest.fn((key: string) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('useFavorites', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  it('starts with empty favorites', () => {
    const { result } = renderHook(() => useFavorites());
    expect(result.current.favorites).toHaveLength(0);
    expect(result.current.count).toBe(0);
  });

  it('adds a favorite', () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.addFavorite('herb-1', 'herb', 'Astragalus');
    });

    expect(result.current.count).toBe(1);
    expect(result.current.isFavorite('herb-1')).toBe(true);
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it('removes a favorite', () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.addFavorite('herb-1', 'herb', 'Astragalus');
    });
    expect(result.current.count).toBe(1);

    act(() => {
      result.current.removeFavorite('herb-1');
    });
    expect(result.current.count).toBe(0);
    expect(result.current.isFavorite('herb-1')).toBe(false);
  });

  it('toggles a favorite', () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.toggleFavorite('herb-1', 'herb', 'Astragalus');
    });
    expect(result.current.isFavorite('herb-1')).toBe(true);

    act(() => {
      result.current.toggleFavorite('herb-1', 'herb', 'Astragalus');
    });
    expect(result.current.isFavorite('herb-1')).toBe(false);
  });

  it('filters favorites by type', () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.addFavorite('herb-1', 'herb', 'Astragalus');
      result.current.addFavorite('formula-1', 'formula', 'Si Jun Zi Tang');
      result.current.addFavorite('herb-2', 'herb', 'Ginkgo');
    });

    expect(result.current.getFavoritesByType('herb')).toHaveLength(2);
    expect(result.current.getFavoritesByType('formula')).toHaveLength(1);
    expect(result.current.getFavoritesByType('condition')).toHaveLength(0);
  });

  it('persists to localStorage', () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.addFavorite('herb-1', 'herb', 'Astragalus');
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'verscienta_favorites',
      expect.stringContaining('herb-1')
    );
  });
});
