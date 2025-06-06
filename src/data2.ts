// don't fuck with this
export const cat = [
  'ملابس واقية',
  'امان الرأس',
  'احذية امان',
  'انذارات',
  'حريق',
];

/*
  example   {
    title: '',
    category: '',
  },
*/
// category must be cat title and the same length
export const products = [
  {
    title: '',
    category: '',
  },
];
/* example {
    wraped_in: 'نظارة',
    title: 'نظارة مستورة	',
    color: 'اسود',
    size: 'كبير',
    qty: 50,
    cost_price: 360,
    sell_price: 280,
    note: null,
  } */
// wraped_in must be product title and the same length
// wrong ('بشبوري ') - correct ('بشبوري')
// you can keep color, size, note = null
// qty can't be 0 don't ever left it 0
// cost_price & sell_price per unit
// cost_price can't be greater than sell_price
export const items = [
  {
    wraped_in: '',
    title: '',
    color: null,
    size: null,
    qty: 0,
    cost_price: 500,
    sell_price: 550,
    note: null,
  },
];
