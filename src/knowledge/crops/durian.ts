import type { CropModule } from '../types';

/**
 * Durian module: high-value fruit crop of the Mekong Delta where one missed
 * Phytophthora case can cost a whole tree. Immediate actions stay
 * non-chemical; treatment choices go through the expert tier and the officer.
 */
export const durian: CropModule = {
  id: 'durian',
  names: { vi: 'Sầu riêng', en: 'Durian' },
  promptName: 'durian (Durio zibethinus)',
  shots: [
    {
      id: 'close',
      label: { vi: 'Cận cảnh vết bệnh', en: 'Close-up of symptom' },
      hint: {
        vi: 'Chụp gần lá, vỏ thân hoặc trái bị bệnh; vết bệnh chiếm phần lớn khung hình.',
        en: 'Shoot close to the affected leaf, bark or fruit so the symptom fills the frame.',
      },
    },
    {
      id: 'trunk_fruit',
      label: { vi: 'Thân gốc / trái', en: 'Trunk base / fruit' },
      hint: {
        vi: 'Chụp gốc thân sát đất (xem xì mủ) hoặc trái và cuống trái (xem sâu, rệp).',
        en: 'Shoot the trunk base near the soil (oozing) or the fruit and stalk (borers, mealybugs).',
      },
    },
    {
      id: 'tree',
      label: { vi: 'Toàn cây / tán', en: 'Whole tree / canopy' },
      hint: {
        vi: 'Lùi xa để thấy tán lá: vàng lá, rụng lá hay khô cành.',
        en: 'Step back to show the canopy: yellowing, leaf drop or dieback.',
      },
    },
  ],
  growthStages: [
    { id: 'young_tree', label: { vi: 'Cây con / kiến thiết', en: 'Young tree' } },
    { id: 'leaf_flush', label: { vi: 'Ra đọt non', en: 'Leaf flush' } },
    { id: 'flowering', label: { vi: 'Ra hoa', en: 'Flowering' } },
    { id: 'fruit_development', label: { vi: 'Nuôi trái', en: 'Fruit development' } },
    { id: 'harvest', label: { vi: 'Thu hoạch', en: 'Harvest' } },
  ],
  conditions: [
    {
      id: 'phytophthora',
      kind: 'disease',
      names: { vi: 'Thối rễ, xì mủ thân (Phytophthora)', en: 'Phytophthora root rot & stem canker' },
      scientificName: 'Phytophthora palmivora',
      promptHint:
        'Dark wet patches on the trunk or branches oozing reddish-brown sap; yellowing canopy; brown water-soaked fruit rot.',
      profile: {
        organs: ['stem', 'whole_plant', 'fruit', 'root'],
        lesionColors: ['brown', 'dark_purple_black', 'water_soaked_green_grey'],
        lesionShapes: ['irregular_blotch'],
        patterns: ['on_trunk_or_branch', 'whole_plant_discolored_or_stunted'],
        signs: ['sap_ooze'],
      },
      severity: 'high',
      spreadsFast: true,
      reportToStation: true,
      immediateActions: {
        vi: [
          'Khơi rãnh thoát nước, không để nước đọng quanh gốc.',
          'Thu gom, tiêu hủy trái và lá bệnh; không bỏ lại trong vườn.',
          'Vệ sinh dao kéo sau khi cắt cây bệnh; liên hệ khuyến nông về cách xử lý vết bệnh trên thân.',
        ],
        en: [
          'Open drainage channels; do not let water stand around the trunk.',
          'Collect and destroy infected fruit and leaves; do not leave them in the orchard.',
          'Clean tools after cutting infected trees; ask the extension officer how to treat trunk lesions.',
        ],
      },
      lookalikes: ['pink_disease'],
    },
    {
      id: 'anthracnose',
      kind: 'disease',
      names: { vi: 'Bệnh thán thư', en: 'Anthracnose' },
      scientificName: 'Colletotrichum gloeosporioides',
      promptHint:
        'Brown irregular leaf patches starting at the tip or edge, and sunken dark spots on young fruit.',
      profile: {
        organs: ['leaf', 'fruit'],
        lesionColors: ['brown', 'dark_purple_black'],
        lesionShapes: ['irregular_blotch', 'sunken_dark_spots'],
        patterns: ['from_leaf_tip_or_edge', 'scattered_spots'],
        signs: [],
      },
      severity: 'medium',
      spreadsFast: false,
      reportToStation: false,
      immediateActions: {
        vi: ['Tỉa cành tạo tán thông thoáng.', 'Cắt bỏ, tiêu hủy lá và trái bị bệnh.'],
        en: ['Prune for an open, airy canopy.', 'Remove and destroy infected leaves and fruit.'],
      },
      lookalikes: ['leaf_blight'],
    },
    {
      id: 'leaf_blight',
      kind: 'disease',
      names: { vi: 'Bệnh cháy lá', en: 'Leaf blight' },
      scientificName: 'Rhizoctonia solani',
      promptHint:
        'Large water-soaked brown blotches on leaves, often with fungal threads that glue dried leaves together.',
      profile: {
        organs: ['leaf'],
        lesionColors: ['brown', 'water_soaked_green_grey'],
        lesionShapes: ['irregular_blotch'],
        patterns: ['scattered_spots'],
        signs: ['fungal_growth', 'webbing_or_frass'],
      },
      severity: 'medium',
      spreadsFast: false,
      reportToStation: false,
      immediateActions: {
        vi: ['Cắt bỏ cành lá bị cháy, gom tiêu hủy.', 'Giảm độ ẩm trong tán, tránh tưới lên lá.'],
        en: ['Cut and destroy blighted twigs and leaves.', 'Lower canopy humidity; avoid wetting leaves.'],
      },
      lookalikes: ['anthracnose'],
    },
    {
      id: 'pink_disease',
      kind: 'disease',
      names: { vi: 'Bệnh nấm hồng', en: 'Pink disease' },
      scientificName: 'Erythricium salmonicolor',
      promptHint: 'Pink or whitish-pink crust on branches, usually at forks, with leaves wilting above it.',
      profile: {
        organs: ['stem'],
        lesionColors: ['pink', 'white_straw'],
        lesionShapes: ['irregular_blotch'],
        patterns: ['on_trunk_or_branch'],
        signs: ['fungal_growth'],
      },
      severity: 'medium',
      spreadsFast: false,
      reportToStation: false,
      immediateActions: {
        vi: ['Cắt bỏ cành bị nấm hồng nặng, đốt bỏ.', 'Tỉa thông thoáng, nhất là mùa mưa.'],
        en: ['Cut off and burn heavily affected branches.', 'Thin the canopy, especially in the rainy season.'],
      },
      lookalikes: ['phytophthora'],
    },
    {
      id: 'durian_psyllid',
      kind: 'pest',
      names: { vi: 'Rầy phấn trắng', en: 'Durian psyllid' },
      scientificName: 'Allocaridara malayensis',
      promptHint: 'Curled, burnt young leaves on new flushes covered with white waxy threads and tiny insects.',
      profile: {
        organs: ['leaf'],
        lesionColors: ['brown', 'white_straw'],
        lesionShapes: ['folded_or_rolled_leaf'],
        patterns: ['young_shoots_or_flush'],
        signs: ['insects', 'white_waxy_coating'],
      },
      severity: 'medium',
      spreadsFast: true,
      reportToStation: false,
      immediateActions: {
        vi: [
          'Kiểm tra đọt non mỗi 2–3 ngày khi cây ra đọt.',
          'Cắt bỏ đọt bị hại nặng; xịt nước mạnh rửa lớp sáp.',
        ],
        en: [
          'Check young flushes every 2–3 days while the tree flushes.',
          'Cut badly damaged shoots; wash off the wax with a strong water spray.',
        ],
      },
      lookalikes: ['mealybug'],
    },
    {
      id: 'fruit_borer',
      kind: 'pest',
      names: { vi: 'Sâu đục trái', en: 'Fruit borer' },
      scientificName: 'Conogethes punctiferalis',
      promptHint: 'Holes bored into the fruit with brown frass and webbing between fruits.',
      profile: {
        organs: ['fruit'],
        lesionColors: ['brown'],
        lesionShapes: ['cut_or_missing_tissue'],
        patterns: ['scattered_spots'],
        signs: ['bore_holes', 'webbing_or_frass', 'insects'],
      },
      severity: 'medium',
      spreadsFast: false,
      reportToStation: false,
      immediateActions: {
        vi: ['Tỉa bớt trái chạm nhau để sâu khó ẩn nấp.', 'Bao trái và gom tiêu hủy trái bị đục.'],
        en: ['Thin touching fruits so larvae cannot hide.', 'Bag fruit and destroy bored fruit.'],
      },
      lookalikes: [],
    },
    {
      id: 'mealybug',
      kind: 'pest',
      names: { vi: 'Rệp sáp', en: 'Mealybugs' },
      scientificName: 'Planococcus spp.',
      promptHint: 'White cottony insects clustered on the fruit stalk or fruit, often with ants and black sooty mould.',
      profile: {
        organs: ['fruit', 'stem'],
        lesionColors: ['white_straw', 'dark_purple_black'],
        lesionShapes: ['none'],
        patterns: ['scattered_spots'],
        signs: ['insects', 'white_waxy_coating'],
      },
      severity: 'low',
      spreadsFast: false,
      reportToStation: false,
      immediateActions: {
        vi: ['Chặn đường kiến lên cây (kiến mang rệp đi).', 'Chải rửa ổ rệp trên cuống trái.'],
        en: ['Block ants from climbing the tree (they spread mealybugs).', 'Brush and wash colonies off fruit stalks.'],
      },
      lookalikes: ['durian_psyllid'],
    },
    {
      id: 'algal_leaf_spot',
      kind: 'disease',
      names: { vi: 'Bệnh đốm rong', en: 'Algal leaf spot' },
      scientificName: 'Cephaleuros virescens',
      promptHint: 'Raised, velvety orange-rust round spots on older leaves.',
      profile: {
        organs: ['leaf'],
        lesionColors: ['yellow_orange'],
        lesionShapes: ['small_round_oval'],
        patterns: ['scattered_spots'],
        signs: [],
      },
      severity: 'low',
      spreadsFast: false,
      reportToStation: false,
      immediateActions: {
        vi: ['Tỉa cành cho vườn thông thoáng, đủ nắng.'],
        en: ['Prune for airflow and sunlight.'],
      },
      lookalikes: [],
    },
    {
      id: 'healthy',
      kind: 'healthy',
      names: { vi: 'Cây khỏe', en: 'Healthy' },
      promptHint: 'Glossy uniform leaves and clean bark without lesions, insects or ooze.',
      profile: {
        organs: ['leaf', 'whole_plant'],
        lesionColors: ['none'],
        lesionShapes: ['none'],
        patterns: ['uniform_healthy'],
        signs: [],
      },
      severity: 'low',
      spreadsFast: false,
      reportToStation: false,
      immediateActions: {
        vi: ['Tiếp tục thăm vườn hằng tuần, nhất là đầu mùa mưa.'],
        en: ['Keep scouting weekly, especially at the start of the rainy season.'],
      },
      lookalikes: [],
    },
  ],
};
