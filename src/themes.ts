export const themeIds=['aurore','lagon','nocturne','citrus','papier'] as const;
export type ThemeId=typeof themeIds[number];
export type Palette={id:ThemeId;name:string;description:string;bg:string;panel:string;board:string;ink:string;muted:string;border:string;grid:string;node:string;given:string;accent:string;secondary:string;win:string;glow:string;wash:string};
export const themes:Palette[]=[
 {id:'aurore',name:'Aurore',description:'Iris, framboise et lumière',bg:'#f5f0ff',panel:'#fffcff',board:'#fffaff',ink:'#382257',muted:'#817099',border:'#e3d7f0',grid:'#dcd1ed',node:'#c6b3de',given:'#6743c5',accent:'#ec5690',secondary:'#28bdb4',win:'#0d9e8d',glow:'#d9c5ff',wash:'#f8d4eb'},
 {id:'lagon',name:'Lagon',description:'Turquoise et corail',bg:'#edfbfa',panel:'#faffff',board:'#f9fffd',ink:'#124f59',muted:'#638b92',border:'#c5e7e3',grid:'#cee6df',node:'#99c9c1',given:'#087f8c',accent:'#f47769',secondary:'#26b8c9',win:'#079971',glow:'#b1f2e9',wash:'#ffe0cd'},
 {id:'nocturne',name:'Nocturne',description:'Indigo et néons doux',bg:'#15182d',panel:'#20243d',board:'#20243b',ink:'#f0eaff',muted:'#ada9c8',border:'#373c61',grid:'#363b59',node:'#5e6387',given:'#a69aff',accent:'#ff83bc',secondary:'#60e0d3',win:'#60e0d3',glow:'#38336a',wash:'#472b52'},
 {id:'citrus',name:'Citrus',description:'Mandarine et rose vif',bg:'#fff5e9',panel:'#fffdfa',board:'#fffdf5',ink:'#704126',muted:'#a8856b',border:'#f1dac0',grid:'#f1e0c6',node:'#dfbf97',given:'#e48c20',accent:'#d9568e',secondary:'#75b979',win:'#428f70',glow:'#ffdea1',wash:'#ffd4e4'},
 {id:'papier',name:'Papier',description:'Encre verte et cuivre',bg:'#f7f5ee',panel:'#fffcf5',board:'#fcfbf6',ink:'#214d43',muted:'#7c8977',border:'#dedfd4',grid:'#dce4dd',node:'#b8c7bd',given:'#236a60',accent:'#d0774d',secondary:'#8da575',win:'#287a69',glow:'#e1e9d1',wash:'#f3dfc9'}
];
export const validTheme=(value:unknown):value is ThemeId=>themeIds.includes(value as ThemeId);
export const palette=(id:ThemeId)=>themes.find(theme=>theme.id===id)||themes[0];
