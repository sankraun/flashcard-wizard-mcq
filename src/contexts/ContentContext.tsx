import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

// --- Types for collections, tags, and content items ---
export interface Collection {
  id: string;
  name: string;
  description?: string;
  user_id: string;
  parent_id?: string;
  icon?: string;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  user_id: string;
  created_at: string;
}

export interface ContentItem {
  id: string;
  title: string;
  type: 'mcq' | 'notes' | 'pdf';
  content: any;
  collection_id?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  tags: string[];
}

interface ContentContextType {
  collections: Collection[];
  tags: Tag[];
  contentItems: ContentItem[];
  currentCollection: Collection | null;
  createCollection: (data: { name: string; description?: string; parentId?: string }) => Promise<Collection>;
  updateCollection: (id: string, data: Partial<Collection>) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
  createTag: (data: { name: string; color: string }) => Promise<Tag>;
  deleteTag: (id: string) => Promise<void>;
  addContentItem: (data: Omit<ContentItem, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<ContentItem>;
  updateContentItem: (id: string, data: Partial<ContentItem>) => Promise<void>;
  deleteContentItem: (id: string) => Promise<void>;
  searchContent: (query: string) => Promise<ContentItem[]>;
  setCurrentCollection: (collection: Collection | null) => void;
  loading: boolean;
  error: Error | null;
}

const ContentContext = createContext<ContentContextType | undefined>(undefined);

export const useContent = () => {
  const context = useContext(ContentContext);
  if (context === undefined) {
    throw new Error('useContent must be used within a ContentProvider');
  }
  return context;
};

export const ContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [currentCollection, setCurrentCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load initial data
  useEffect(() => {
    if (user) {
      loadInitialData();
    }
  }, [user]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadCollections(),
        loadTags(),
        loadContentItems(),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load data'));
    } finally {
      setLoading(false);
    }
  };

  // --- CRUD for collections ---
  const loadCollections = async () => {
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .eq('user_id', user!.id)
      .order('name');
    if (error) throw error;
    setCollections(data || []);
  };

  const createCollection = async (data: { name: string; description?: string; parentId?: string }) => {
    const { data: newCollection, error } = await supabase
      .from('collections')
      .insert({
        name: data.name,
        description: data.description,
        parent_id: data.parentId,
        user_id: user!.id,
      })
      .select()
      .single();
    if (error) throw error;
    setCollections([...collections, newCollection]);
    return newCollection;
  };

  const updateCollection = async (id: string, data: Partial<Collection>) => {
    const { error } = await supabase
      .from('collections')
      .update(data)
      .eq('id', id);
    if (error) throw error;
    setCollections(collections.map(c => c.id === id ? { ...c, ...data } : c));
  };

  const deleteCollection = async (id: string) => {
    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', id);
    if (error) throw error;
    setCollections(collections.filter(c => c.id !== id));
  };

  // --- CRUD for tags ---
  const loadTags = async () => {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('user_id', user!.id)
      .order('name');
    if (error) throw error;
    setTags(data || []);
  };

  const createTag = async (data: { name: string; color: string }) => {
    const { data: newTag, error } = await supabase
      .from('tags')
      .insert({
        name: data.name,
        color: data.color,
        user_id: user!.id,
      })
      .select()
      .single();
    if (error) throw error;
    setTags([...tags, newTag]);
    return newTag;
  };

  const deleteTag = async (id: string) => {
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', id);
    if (error) throw error;
    setTags(tags.filter(t => t.id !== id));
  };

  // --- CRUD for content items ---
  const loadContentItems = async () => {
    const { data, error } = await supabase
      .from('content_items')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    setContentItems(data || []);
  };

  const addContentItem = async (data: Omit<ContentItem, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    const { data: newItem, error } = await supabase
      .from('content_items')
      .insert({
        ...data,
        user_id: user!.id,
      })
      .select()
      .single();
    if (error) throw error;
    setContentItems([newItem, ...contentItems]);
    return newItem;
  };

  const updateContentItem = async (id: string, data: Partial<ContentItem>) => {
    const { error } = await supabase
      .from('content_items')
      .update(data)
      .eq('id', id);
    if (error) throw error;
    setContentItems(contentItems.map(item => item.id === id ? { ...item, ...data } : item));
  };

  const deleteContentItem = async (id: string) => {
    const { error } = await supabase
      .from('content_items')
      .delete()
      .eq('id', id);
    if (error) throw error;
    setContentItems(contentItems.filter(item => item.id !== id));
  };

  // --- Search functionality ---
  const searchContent = async (query: string): Promise<ContentItem[]> => {
    const { data, error } = await supabase
      .from('content_items')
      .select('*')
      .eq('user_id', user!.id)
      .ilike('title', `%${query}%`)
      .limit(20);
    if (error) throw error;
    return data || [];
  };

  const value = {
    collections,
    tags,
    contentItems,
    currentCollection,
    createCollection,
    updateCollection,
    deleteCollection,
    createTag,
    deleteTag,
    addContentItem,
    updateContentItem,
    deleteContentItem,
    searchContent,
    setCurrentCollection,
    loading,
    error,
  };

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
};

export default ContentProvider;