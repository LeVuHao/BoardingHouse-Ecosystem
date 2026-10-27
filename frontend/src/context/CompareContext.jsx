import React, { createContext, useContext, useState, useCallback } from 'react';
import toast from 'react-hot-toast';

const CompareContext = createContext(null);

const MAX_COMPARE = 3;

export const CompareProvider = ({ children }) => {
  const [compareList, setCompareList] = useState([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  const addToCompare = useCallback((post) => {
    setCompareList((prev) => {
      if (prev.some((p) => p.id === post.id)) {
        toast('Phòng này đã được thêm vào danh sách so sánh.', { icon: 'ℹ️' });
        return prev;
      }
      if (prev.length >= MAX_COMPARE) {
        toast.error(`Chỉ có thể so sánh tối đa ${MAX_COMPARE} phòng cùng lúc.`);
        return prev;
      }
      toast.success('Đã thêm vào bảng so sánh!', { duration: 1500 });
      return [...prev, post];
    });
  }, []);

  const removeFromCompare = useCallback((postId) => {
    setCompareList((prev) => prev.filter((p) => p.id !== postId));
  }, []);

  const clearCompare = useCallback(() => {
    setCompareList([]);
    setIsCompareModalOpen(false);
  }, []);

  const isInCompare = useCallback(
    (postId) => compareList.some((p) => p.id === postId),
    [compareList],
  );

  const openCompareModal = useCallback(() => {
    if (compareList.length < 2) {
      toast('Hãy chọn ít nhất 2 phòng để so sánh!', { icon: '⚖️' });
      return;
    }
    setIsCompareModalOpen(true);
  }, [compareList.length]);

  const closeCompareModal = useCallback(() => {
    setIsCompareModalOpen(false);
  }, []);

  return (
    <CompareContext.Provider
      value={{
        compareList,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isInCompare,
        isCompareModalOpen,
        openCompareModal,
        closeCompareModal,
        MAX_COMPARE,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
};

export const useCompare = () => {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error('useCompare must be used inside CompareProvider');
  return ctx;
};
