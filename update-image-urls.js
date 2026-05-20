const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://norjvtaujxlbdbqgkmwd.supabase.co';
const supabaseKey = process.argv[2]; // Service role key from command line

if (!supabaseKey) {
  console.error('Usage: node update-image-urls.js <SUPABASE_SERVICE_ROLE_KEY>');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const OLD_PROJECT = 'mgprrbrevhzsvgizypov';
const NEW_PROJECT = 'norjvtaujxlbdbqgkmwd';

async function updateUrls() {
  console.log('🔄 Updating image URLs from Paris to Stockholm...\n');

  // Update products table (image field)
  console.log('1. Updating products table...');
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id', 'image');

  if (productsError) {
    console.error('Error fetching products:', productsError);
  } else {
    let updatedProducts = 0;
    for (const product of products) {
      if (product.image && product.image.includes(OLD_PROJECT)) {
        const newImage = product.image.replace(OLD_PROJECT, NEW_PROJECT);
        const { error } = await supabase
          .from('products')
          .update({ image: newImage })
          .eq('id', product.id);

        if (error) {
          console.error(`  ❌ Error updating product ${product.id}:`, error);
        } else {
          updatedProducts++;
          console.log(`  ✅ Updated product: ${product.id}`);
        }
      }
    }
    console.log(`   Total products updated: ${updatedProducts}\n`);
  }

  // Update product_images table
  console.log('2. Updating product_images...');
  const { data: productImages, error: imagesError } = await supabase
    .from('product_images')
    .select('id', 'url');

  if (imagesError) {
    console.error('Error fetching product images:', imagesError);
    return;
  }

  let updatedImages = 0;
  for (const image of productImages) {
    if (image.url && image.url.includes(OLD_PROJECT)) {
      const newUrl = image.url.replace(OLD_PROJECT, NEW_PROJECT);
      const { error } = await supabase
        .from('product_images')
        .update({ url: newUrl })
        .eq('id', image.id);

      if (error) {
        console.error(`  ❌ Error updating image ${image.id}:`, error);
      } else {
        updatedImages++;
        console.log(`  ✅ Updated: ${image.id}`);
      }
    }
  }
  console.log(`   Total updated: ${updatedImages}\n`);

  // Update user_profiles avatars
  console.log('3. Updating user_profiles avatars...');
  const { data: profiles, error: profilesError } = await supabase
    .from('user_profiles')
    .select('user_id', 'avatar');

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError);
    return;
  }

  let updatedProfiles = 0;
  for (const profile of profiles) {
    if (profile.avatar && profile.avatar.includes(OLD_PROJECT)) {
      const newAvatar = profile.avatar.replace(OLD_PROJECT, NEW_PROJECT);
      const { error } = await supabase
        .from('user_profiles')
        .update({ avatar: newAvatar })
        .eq('user_id', profile.user_id);

      if (error) {
        console.error(`  ❌ Error updating profile ${profile.user_id}:`, error);
      } else {
        updatedProfiles++;
        console.log(`  ✅ Updated: ${profile.user_id}`);
      }
    }
  }
  console.log(`   Total updated: ${updatedProfiles}\n`);

  // Update users table (image field)
  console.log('4. Updating users table images...');
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id', 'image');

  if (usersError) {
    console.error('Error fetching users:', usersError);
    return;
  }

  let updatedUsers = 0;
  for (const user of users) {
    if (user.image && user.image.includes(OLD_PROJECT)) {
      const newImage = user.image.replace(OLD_PROJECT, NEW_PROJECT);
      const { error } = await supabase
        .from('users')
        .update({ image: newImage })
        .eq('id', user.id);

      if (error) {
        console.error(`  ❌ Error updating user ${user.id}:`, error);
      } else {
        updatedUsers++;
        console.log(`  ✅ Updated: ${user.id}`);
      }
    }
  }
  console.log(`   Total updated: ${updatedUsers}\n`);

  // Update site_content table (any image fields)
  console.log('5. Updating site_content images...');
  const { data: content, error: contentError } = await supabase
    .from('site_content')
    .select('id', 'image_url', 'background_image');

  if (contentError) {
    console.error('Error fetching site content:', contentError);
  } else {
    let updatedContent = 0;
    for (const item of content) {
      let updates = {};
      
      if (item.image_url && item.image_url.includes(OLD_PROJECT)) {
        updates.image_url = item.image_url.replace(OLD_PROJECT, NEW_PROJECT);
      }
      
      if (item.background_image && item.background_image.includes(OLD_PROJECT)) {
        updates.background_image = item.background_image.replace(OLD_PROJECT, NEW_PROJECT);
      }
      
      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from('site_content')
          .update(updates)
          .eq('id', item.id);

        if (error) {
          console.error(`  ❌ Error updating content ${item.id}:`, error);
        } else {
          updatedContent++;
          console.log(`  ✅ Updated content: ${item.id}`);
        }
      }
    }
    console.log(`   Total content updated: ${updatedContent}\n`);
  }

  console.log('✅ Migration complete!');
  console.log(`   Check console output above for details`);
}

updateUrls().catch(console.error);
