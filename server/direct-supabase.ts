import { supabase } from './supabase-setup';
import { categories, type Category, type InsertCategory } from '../shared/schema';

/**
 * Supabase API uzerinden dogrudan islem yapmak icin yardimci fonksiyonlar
 * Bu fonksiyonlar direct-db.ts'nin Supabase versiyonu olarak dusunulebilir
 */

/**
 * Tum kategorileri getir
 */
export async function getAllCategories(): Promise<Category[]> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*');
    
    if (error) {
      console.error('Kategori getirme hatasi:', error);
      return [];
    }
    
    if (!data || data.length === 0) {
      return [];
    }
    
    return data.map(category => ({
      id: category.id,
      name: category.name,
      description: category.description,
      iconUrl: category.icon_url
    }));
  } catch (error) {
    console.error('Kategori getirme isleminde beklenmeyen hata:', error);
    return [];
  }
}

/**
 * Belirli bir kategori getir
 */
export async function getCategoryById(id: number): Promise<Category | null> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error(`ID ${id} olan kategori getirme hatasi:`, error);
      return null;
    }
    
    if (!data) {
      return null;
    }
    
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      iconUrl: data.icon_url
    };
  } catch (error) {
    console.error(`ID ${id} olan kategori getirmede beklenmeyen hata:`, error);
    return null;
  }
}

/**
 * Yeni kategori olustur
 */
export async function createCategory(category: InsertCategory): Promise<Category | null> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: category.name,
        description: category.description || null,
        icon_url: category.iconUrl || null
      })
      .select()
      .single();
    
    if (error) {
      console.error('Kategori olusturma hatasi:', error);
      return null;
    }
    
    if (!data) {
      return null;
    }
    
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      iconUrl: data.icon_url
    };
  } catch (error) {
    console.error('Kategori olusturmada beklenmeyen hata:', error);
    return null;
  }
}

/**
 * Kategori guncelle
 */
export async function updateCategory(id: number, category: InsertCategory): Promise<Category | null> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .update({
        name: category.name,
        description: category.description || null,
        icon_url: category.iconUrl || null
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error(`ID ${id} olan kategori guncelleme hatasi:`, error);
      return null;
    }
    
    if (!data) {
      return null;
    }
    
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      iconUrl: data.icon_url
    };
  } catch (error) {
    console.error(`ID ${id} olan kategori guncellemede beklenmeyen hata:`, error);
    return null;
  }
}