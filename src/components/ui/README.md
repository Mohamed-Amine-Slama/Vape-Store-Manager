# Unified Dropdown Components

This project now uses unified dropdown components with dark theme styling and enhanced functionality. All dropdown usage across the application has been standardized.

## Components Available

### 1. CustomDropdown
A sophisticated dropdown with search functionality, icons, and descriptions.

**Features:**
- Dark theme styling with vapor-inspired colors
- Searchable options
- Icons and descriptions for options
- Clearable selections
- Multiple sizes (sm, md, lg)
- Error states
- Keyboard navigation
- Mobile-responsive

**Usage:**
```jsx
import { CustomDropdown } from './ui'

<CustomDropdown
  label="Store Selection"
  options={[
    { 
      value: 'store1', 
      label: 'Main Store', 
      icon: <Store />, 
      description: 'Primary location' 
    },
    { 
      value: 'store2', 
      label: 'Branch Store', 
      icon: <Building />, 
      description: 'Secondary location' 
    }
  ]}
  value={selectedStore}
  onChange={setSelectedStore}
  placeholder="Choose a store..."
  searchable={true}
  clearable={true}
  icon={<Building2 />}
  size="md"
/>
```

### 2. SearchableDropdown
An advanced dropdown with fuzzy search capabilities, perfect for product selection.

**Features:**
- All CustomDropdown features plus:
- Fuzzy search with similarity scoring
- Match type indicators (exact, starts with, contains, etc.)
- Custom option and selected item renderers
- Debounced search for performance
- Loading states
- Maximum results limiting

**Usage:**
```jsx
import { SearchableDropdown } from './ui'

<SearchableDropdown
  label="Product"
  options={productOptions}
  value={selectedProductId}
  onChange={handleProductSelect}
  placeholder="Search and select product..."
  icon={<Package />}
  searchKey="name"
  displayKey="name"
  valueKey="id"
  fuzzySearchEnabled={true}
  maxResults={8}
  clearable={true}
  onSelect={(product) => console.log('Selected:', product)}
/>
```

## Dark Theme Integration

Both components automatically use the dark theme CSS variables:

- `--bg-card`: Card backgrounds
- `--bg-elevated`: Elevated surfaces
- `--border-primary`: Default borders
- `--accent-vapor`: Primary accent (cyan)
- `--accent-electric`: Secondary accent (purple)
- `--text-primary`: Primary text
- `--text-secondary`: Secondary text
- `--text-muted`: Muted text
- `--shadow-glow`: Neon glow effects
- `--shadow-xl`: Enhanced shadows

## Migration Guide

### From Select Component

**Before:**
```jsx
<Select
  label="Category"
  value={category}
  onChange={(e) => setCategory(e.target.value)}
  options={[
    { value: 'fruities', label: 'Fruities' },
    { value: 'puffs', label: 'Puffs' }
  ]}
/>
```

**After:**
```jsx
<CustomDropdown
  label="Category"
  value={category}
  onChange={setCategory} // Note: direct value, not event
  options={[
    { 
      value: 'fruities', 
      label: '🍓 Fruities',
      icon: <Fruit />,
      description: 'Fruit-flavored liquids'
    },
    { 
      value: 'puffs', 
      label: '💨 Puffs',
      icon: <Cloud />,
      description: 'Disposable vapes'
    }
  ]}
  placeholder="Select category..."
  icon={<Package />}
/>
```

### From Custom Product Dropdowns

**Before:**
```jsx
// Complex custom dropdown implementation with search
<div className="relative">
  <input
    value={search}
    onChange={handleSearch}
    placeholder="Search products..."
  />
  {showDropdown && (
    <div className="dropdown">
      {filteredProducts.map(product => (
        <div key={product.id} onClick={() => select(product)}>
          {product.name}
        </div>
      ))}
    </div>
  )}
</div>
```

**After:**
```jsx
<SearchableDropdown
  options={products.map(p => ({
    value: p.id,
    label: p.name,
    description: `${p.category} • ${formatCurrency(p.price)}`
  }))}
  value={selectedProductId}
  onChange={setSelectedProductId}
  placeholder="Search and select product..."
  fuzzySearchEnabled={true}
  maxResults={8}
/>
```

## Updated Components

The following components have been updated to use the unified dropdowns:

1. **RecordSale** - Uses SearchableDropdown for product selection
2. **FDManagement** - Uses CustomDropdown for store selection
3. **UserManagement** - Uses CustomDropdown for role selection
4. **InventoryManager** - Uses CustomDropdown for adjustment types
5. **WorkerTransactions** - Uses CustomDropdown for transaction types and categories

## Benefits

1. **Consistency**: Unified look and feel across the application
2. **Dark Theme**: Professional vape store aesthetic
3. **Performance**: Debounced search and optimized rendering
4. **Accessibility**: Proper keyboard navigation and ARIA support
5. **Mobile-First**: Touch-friendly and responsive design
6. **Enhanced UX**: Fuzzy search, descriptions, and visual indicators
7. **Maintainability**: Single source of truth for dropdown functionality

## Styling

The components use CSS-in-JS with CSS variables for theming. The dark theme provides:

- Deep dark backgrounds with subtle gradients
- Vapor-inspired accent colors (cyan, purple, green)
- Glow effects on focus and hover
- Smooth animations and transitions
- Professional typography and spacing
