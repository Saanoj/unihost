import { supabase } from '../../lib/supabase';
import { Property } from '../../types';

export const createProperty = async (propertyData: Omit<Property, 'id' | 'created_at'>): Promise<Property | null> => {
  try {
    // First try a regular insert to avoid constraint errors
    const { data: insertData, error: insertError } = await supabase
      .from('properties')
      .insert([propertyData])
      .select()
      .single();

    if (!insertError) {
      return insertData;
    }

    // If error is not a duplicate key violation, it's a real error
    if (insertError.code !== '23505') {
      console.error('Error creating property:', insertError);
      
      // Try to get the property if it already exists
      const { data: existingProperty, error: fetchError } = await supabase
        .from('properties')
        .select('*')
        .eq('name', propertyData.name)
        .eq('host_id', propertyData.host_id)
        .single();
      
      if (fetchError || !existingProperty) {
        console.error('Failed to fetch existing property:', fetchError);
        return null;
      }
      
      // Use the existing property
      console.log('Using existing property');
      return existingProperty;
    } else {
      // It's a duplicate, so just fetch the existing property
      const { data: existingProperty, error: fetchError } = await supabase
        .from('properties')
        .select('*')
        .eq('name', propertyData.name)
        .eq('host_id', propertyData.host_id)
        .single();
      
      if (fetchError) {
        console.error('Failed to fetch existing property after duplicate error:', fetchError);
        return null;
      }
      
      return existingProperty;
    }
  } catch (error) {
    console.error('Unexpected error creating property:', error);
    return null;
  }
};

export const getPropertiesByHostId = async (hostId: string): Promise<Property[] | null> => {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('host_id', hostId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching properties:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error fetching properties:', error);
    return null;
  }
};

export const getPropertyById = async (propertyId: string): Promise<Property | null> => {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single();

    if (error) {
      console.error('Error fetching property:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error fetching property:', error);
    return null;
  }
};