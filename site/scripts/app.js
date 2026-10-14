import {effectiveBand, progressKey, stageUnlocked, newRound, selectionHistory, revealHint, answerRound, advanceRound, completeStage, totalStars, recoverSavedRounds, SUBJECTS} from "./game.js";
import {createStore, AVATARS} from "./storage.js";
import {celebrate, stopCelebration, selectAnswer, celebrationCount} from "./celebration.js";
import {playEncouragement} from "./audio.js";

const app = document.querySelector("#app");
const notice = document.querySelector("#storage-notice");
const recoveryNotice = document.querySelector("#recovery-notice");
const live = document.querySelector("#live-region");
let ui;
let deferredInstall = null;
let installInviteShown = false;
const isInstalled = () => window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();deferredInstall=event;
  if (ui && screen === "welcome" && !isInstalled()) showInstallInvite();
});
window.addEventListener("appinstalled",()=>{deferredInstall=null;document.querySelector("#install-button")?.remove();document.querySelector("#install-dialog")?.close();});
let cards;
let store;
let screen = "welcome";
let pendingAnswer = null;
let resultRound = null;
let roundError = false;
let recoveredRound = false;
let playerStep = 0;
let playerPage = 0;
let teacherPage = 0;
let mapStep = 0;
let helpPage = 0;
let roundView = "prompt";
let choiceIndex = 0;
let playerDraft = {namePreset: "", customName: "", age: 6, avatar: AVATARS[0]};

function node(tag, props = {}, ...children) {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key === "class") element.className = value;
    else if (key === "text") element.textContent = value;
    else if (key.startsWith("on")) element.addEventListener(key.slice(2).toLowerCase(), value);
    else if (value !== null && value !== undefined) element.setAttribute(key, String(value));
  }
  for (const child of children.flat()) if (child !== null && child !== undefined) element.append(child instanceof Node ? child : document.createTextNode(String(child)));
  return element;
}

function t(key, vars = {}) {
  let value = ui[key] ?? key;
  for (const [name, content] of Object.entries(vars)) value = value.replaceAll(`{${name}}`, String(content));
  return value;
}

function button(label, onClick, kind = "secondary", extra = {}) {
  return node("button", {type: "button", class: `btn btn-${kind}`, onclick: onClick, ...extra}, label);
}

function actionRow(...items) { return node("div", {class: "actions"}, items); }
function panel(...items) { return node("section", {class: "panel"}, items); }
function heading(title, eyebrow) { return node("div", {}, eyebrow ? node("div", {class:"eyebrow",text:eyebrow}) : null, node("h1", {text:title})); }
function back(to) { return node("div", {class:"back-row"}, button(t("back"), () => navigate(to))); }
function say(message) { live.textContent = ""; requestAnimationFrame(() => { live.textContent = message; }); }
function state() { return store.get(); }
function activeProfile() { return state().profiles.find(profile => profile.id === state().activeProfileId); }
function allTeachers() { return [...ui.presetTeachers, ...state().teachers]; }
function activeTeacher() { return allTeachers().find(teacher => teacher.id === state().activeTeacherId); }
function avatarImage(id) { return node("img", {class:"avatar-img",src:`assets/avatar-${id}.svg`,alt:"",width:"56",height:"56"}); }
function soundButton() { return button(t(state().settings.soundEnabled ? "muteSound" : "enableSound"), () => {save({...state(),settings:{...state().settings,soundEnabled:!state().settings.soundEnabled}});render();},"secondary"); }
function pageControls(previous, next, current, total) { return node("div", {class:"pager"},button(t("previous"),previous,"secondary",current===0?{disabled:""}:{}),node("span", {class:"pill",text:t("pageCount",{current:current+1,total})}),button(t("next"),next,"primary",current===total-1?{disabled:""}:{})); }

function save(next) {
  store.save(next);
  notice.textContent = t("storageNotice");
  notice.hidden = store.persistent();
  recoveryNotice.textContent = t("roundRecovered");
  recoveryNotice.hidden = !recoveredRound;
  document.body.classList.toggle("reduce-motion", state().settings.reducedMotion);
}

function updateProfile(changes) {
  const current = state();
  save({...current, profiles: current.profiles.map(profile => profile.id === current.activeProfileId ? {...profile, ...changes} : profile)});
}

function navigate(next) {
  pendingAnswer=null;stopCelebration();
  if (next==="help" && screen!=="help") helpPage=0;
  screen = next;
  render();
  app.focus({preventScroll:true});
  window.scrollTo({top:0,behavior:"instant"});
}

function render() {
  app.replaceChildren();
  document.querySelector("#brand-name").textContent = t("brand");
  document.querySelector("#skip-link").textContent = t("skipLink");
  document.querySelector("#footer").textContent = t("footer");
  let homeButton = document.querySelector("#home-button");
  if (!homeButton) {
    homeButton = button(t("homeButton"), () => {
      if (document.querySelector("#home-confirm")) return;
      const dialog = node("dialog", {id:"home-confirm","aria-labelledby":"home-confirm-title"},
        node("h2", {id:"home-confirm-title",text:t("homeConfirm")}),
        actionRow(button(t("cancel"),()=>dialog.close()),button(t("homeButton"),()=>{dialog.close();navigate("welcome");},"primary")));
      dialog.addEventListener("close",()=>dialog.remove(),{once:true});
      document.body.append(dialog);
      dialog.showModal();
    });
    homeButton.id = "home-button";
    document.querySelector(".site-header").insertBefore(homeButton, document.querySelector("#app-version"));
  }
  homeButton.textContent = t("homeButton");
  document.title = t("brand");
  notice.textContent = t("storageNotice");
  notice.hidden = store.persistent();
  recoveryNotice.textContent = t("roundRecovered");
  recoveryNotice.hidden = !recoveredRound;
  document.body.classList.toggle("reduce-motion", state().settings.reducedMotion);
  if (screen === "welcome") renderWelcome();
  else if (screen === "players") renderPlayers();
  else if (screen === "new-player") renderNewPlayer();
  else if (screen === "teachers") renderTeachers();
  else if (screen === "new-teacher") renderNewTeacher();
  else if (screen === "map") renderMap();
  else if (screen === "map-options") renderMapOptions();
  else if (screen === "difficulty") renderDifficulty();
  else if (screen === "round") renderRound();
  else if (screen === "result") renderResult();
  else if (screen === "help") renderHelp();
  else if (screen === "restart-confirm") renderRestartConfirm();
}

function restartAdventure() {
  if (!activeProfile()) {playerStep=0;playerDraft={namePreset:"",customName:"",age:4,avatar:AVATARS[0]};navigate("new-player");return;}
  navigate("restart-confirm");
}

function renderRestartConfirm() {
  const profile=activeProfile();
  if (!profile) {navigate("new-player");return;}
  app.append(node("section", {class:"screen panel"},heading(t("restartConfirmTitle")),node("p", {class:"lead",text:t("restartConfirmBody",{name:profile.name})}),
    actionRow(button(t("cancel"),()=>navigate("welcome")),button(t("confirmRestart"),()=>{
      save({...state(),activeProfileId:null,activeTeacherId:null});
      playerStep=0;playerDraft={namePreset:"",customName:"",age:4,avatar:AVATARS[0]};
      navigate("new-player");
    },"primary"))));
}

function showInstallInvite(manual = false) {
  if (isInstalled() || document.querySelector("#install-dialog")) return;
  if (!manual && installInviteShown) return;
  if (!manual) {
    try {if (sessionStorage.getItem("faslna-install-invite")) return;sessionStorage.setItem("faslna-install-invite","1");} catch {}
    installInviteShown=true;
  }
  const ios=/iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform==="MacIntel" && navigator.maxTouchPoints>1);
  const install = async () => {
    const prompt=deferredInstall;
    dialog.close();
    if (!prompt) return;
    deferredInstall=null;
    try {await prompt.prompt();await prompt.userChoice;} catch {}
  };
  const dialog=node("dialog", {id:"install-dialog","aria-labelledby":"install-title"},
    node("h2", {id:"install-title",text:t("installTitle")}),
    node("p", {text:t(deferredInstall?"installInvite":ios?"installIos":"installOther")}),
    actionRow(button(t(deferredInstall?"installLater":"installClose"),()=>dialog.close()),deferredInstall?button(t("installGame"),install,"primary"):null));
  dialog.addEventListener("close",()=>dialog.remove(),{once:true});
  document.body.append(dialog);dialog.showModal();
}

function renderWelcome() {
  const hero = node("section", {class:"hero screen"},
    node("div", {class:"eyebrow",text:t("brand")}),
    node("h1", {text:t("welcomeTitle")}),
    node("aside", {class:"creator-greeting"},node("strong", {text:t("creatorGreetingTitle")}),node("p", {text:t("creatorGreetingBody")})),
    node("p", {class:"lead",text:t("welcomeLead")}),
    node("img", {class:"illustration",src:"assets/classroom.svg",alt:""}),
    node("p", {class:"muted",text:t("welcomeNote")}),
    node("div", {class:"actions center"},
      button(activeProfile() ? t("resume") : t("start"), () => navigate(activeProfile() ? (activeTeacher() ? "map" : "teachers") : "players"), "primary"),
      button(t("howToPlay"), () => navigate("help"))),
    node("div", {class:"actions center"},button(t("restartAdventure"),restartAdventure,"accent"),soundButton()));
  if (!isInstalled()) hero.append(button(t("installGame"),()=>showInstallInvite(true),"secondary",{id:"install-button"}));
  app.append(hero);
}

function renderPlayers() {
  const section = node("div", {class:"screen"}, back("welcome"), heading(t("choosePlayer")));
  if (state().profiles.length) {
    const grid = node("div", {class:"grid profile-grid"});
    const profiles=state().profiles;
    const maxPage=Math.max(0,Math.ceil(profiles.length/2)-1);
    playerPage=Math.min(playerPage,maxPage);
    for (const profile of profiles.slice(playerPage*2,playerPage*2+2)) {
      grid.append(node("button", {type:"button",class:"select-card",onclick:() => {save({...state(),activeProfileId:profile.id}); navigate(activeTeacher() ? "map" : "teachers");}},
        avatarImage(profile.avatar),
        node("strong", {text:profile.name}),
        node("span", {class:"muted",text:`${profile.age}`})));
    }
    section.append(node("h2", {class:"section-title",text:t("savedPlayers")}), grid);
    if (maxPage) section.append(pageControls(()=>{playerPage--;render();},()=>{playerPage++;render();},playerPage,maxPage+1));
  }
  section.append(actionRow(button(t("newPlayer"), () => {playerStep=0;playerDraft={namePreset:ui.presetPlayers[0],customName:"",age:6,avatar:AVATARS[0]};navigate("new-player");}, "primary")));
  app.append(section);
}

function renderNewPlayer() {
  let chosenName = playerDraft.namePreset || "";
  let chosenAvatar = playerDraft.avatar;
  const error = node("p", {class:"muted",role:"alert"});
  const nameInput = node("input", {id:"player-name",type:"text",maxlength:"20",autocomplete:"nickname",placeholder:t("namePlaceholder"),value:playerDraft.customName});
  const nameChips = node("div", {class:"chip-row"});
  ui.presetPlayers.forEach(name => nameChips.append(node("button", {type:"button",class:"chip","aria-pressed":!playerDraft.customName && name === chosenName,onclick:() => {
    chosenName = name; playerDraft.namePreset=name;playerDraft.customName="";nameInput.value = "";
    nameChips.querySelectorAll("button").forEach(item => item.setAttribute("aria-pressed",String(item.textContent === name)));
  }}, name)));
  nameInput.addEventListener("input", () => {playerDraft.customName=nameInput.value;if (nameInput.value.trim()) {chosenName = ""; nameChips.querySelectorAll("button").forEach(item => item.setAttribute("aria-pressed","false"));}});
  const ageInput = node("select", {id:"player-age"});
  for (let age=4;age<=14;age++) ageInput.append(node("option", {value:age,text:String(age)}));
  ageInput.value=String(playerDraft.age);
  ageInput.addEventListener("change",()=>{playerDraft.age=Number(ageInput.value);});
  const avatarGrid = node("div", {class:"grid profile-grid"});
  for (const avatar of AVATARS) avatarGrid.append(node("button", {type:"button",class:`avatar-choice ${avatar === chosenAvatar ? "is-selected" : ""}`,"aria-pressed":avatar === chosenAvatar,onclick:() => {
    chosenAvatar = avatar;playerDraft.avatar=avatar;
    avatarGrid.querySelectorAll("button").forEach(item => {item.classList.toggle("is-selected",item.dataset.avatar === avatar);item.setAttribute("aria-pressed",String(item.dataset.avatar === avatar));});
  },"data-avatar":avatar}, avatarImage(avatar), node("div", {text:t(`avatar${avatar[0].toUpperCase()}${avatar.slice(1)}`)})));
  const create = () => {
    const name = (playerDraft.customName.trim() || playerDraft.namePreset || chosenName).replace(/\s+/g," ");
    if (!name || [...name].length > 20) {error.textContent=t("nameRequired");playerStep=0;render();return;}
    if (state().profiles.length >= 50) {error.textContent=t("playerLimit");return;}
    const profile = {id:crypto.randomUUID(),name,age:playerDraft.age,avatar:chosenAvatar,difficulty:"auto",progress:{},history:{},round:null};
    save({...state(),profiles:[...state().profiles,profile],activeProfileId:profile.id});
    navigate(activeTeacher() ? "map" : "teachers");
  };
  const first = node("div", {class:"screen"},back("players"),heading(t("newPlayer")),panel(
    node("div", {class:"section-title",text:t("presetNames")}),nameChips,
    node("div", {class:"field"},node("label", {for:"player-name",text:t("customName")}),nameInput),
    node("div", {class:"field"},node("label", {for:"player-age",text:t("ageLabel")}),ageInput),
    actionRow(button(t("next"),()=>{if (!(playerDraft.customName.trim() || chosenName)) {error.textContent=t("nameRequired");first.querySelector(".panel").append(error);return;}playerDraft.age=Number(ageInput.value);playerStep=1;render();},"primary"))));
  const second = node("div", {class:"screen"},node("div", {class:"back-row"},button(t("back"),()=>{playerStep=0;render();})),heading(t("avatarLabel")),panel(avatarGrid,error,
    actionRow(button(t("previous"),()=>{playerStep=0;render();}),button(t("createPlayer"),create,"primary"))));
  app.append(playerStep===0?first:second);
}

function renderTeachers() {
  const section = node("div", {class:"screen"},back(activeProfile() && activeTeacher() ? "map" : "players"),heading(t("chooseTeacher")),node("p", {class:"lead",text:t(activeProfile()?.age<=5?"preschoolTeacherLead":"teacherLead")}));
  const grid = node("div", {class:"grid teacher-grid"});
  const teachers=allTeachers(), maxPage=Math.max(0,Math.ceil(teachers.length/2)-1);
  teacherPage=Math.min(teacherPage,maxPage);
  teachers.slice(teacherPage*2,teacherPage*2+2).forEach(teacher => grid.append(node("button", {type:"button",class:"select-card",onclick:() => {save({...state(),activeTeacherId:teacher.id});navigate("map");}},
    node("span", {class:"avatar","aria-hidden":"true",text:"📚"}),node("strong", {text:teacher.name}),node("span", {class:"muted",text:t(teacher.subject)}))));
  section.append(grid);
  if (maxPage) section.append(pageControls(()=>{teacherPage--;render();},()=>{teacherPage++;render();},teacherPage,maxPage+1));
  section.append(actionRow(button(t("addTeacher"),()=>navigate("new-teacher"),"primary")));
  app.append(section);
}

function renderNewTeacher() {
  const nameInput = node("input", {id:"teacher-name",type:"text",maxlength:"20",autocomplete:"off"});
  const subjectSelect = node("select", {id:"teacher-subject"},SUBJECTS.map(subject=>node("option", {value:subject,text:t(subject)})));
  const error = node("p", {role:"alert",class:"muted"});
  const create = () => {
    const name = nameInput.value.trim().replace(/\s+/g," ");
    if (!name || [...name].length > 20) {error.textContent=t("nameRequired");nameInput.focus();return;}
    if (state().teachers.length >= 50) {error.textContent=t("teacherLimit");return;}
    const teacher={id:crypto.randomUUID(),name,subject:subjectSelect.value};
    save({...state(),teachers:[...state().teachers,teacher],activeTeacherId:teacher.id});navigate("map");
  };
  app.append(node("div", {class:"screen"},back("teachers"),heading(t("addTeacher")),panel(
    node("div", {class:"field"},node("label", {for:"teacher-name",text:t("teacherName")}),nameInput),
    node("div", {class:"field"},node("label", {for:"teacher-subject",text:t("subjectLabel")}),subjectSelect),
    error,actionRow(button(t("saveTeacher"),create,"primary")))));
}

function renderMap() {
  const profile=activeProfile(), teacher=activeTeacher();
  if (!profile) {navigate("players");return;}
  if (!teacher) {navigate("teachers");return;}
  const band=effectiveBand(profile.age,profile.difficulty);
  const root=node("div", {class:"screen"},heading(t("mapTitle"),t("mapGreeting",{name:profile.name})));
  if (roundError) root.append(node("div", {class:"notice",role:"alert",text:t("contentError")}));
  root.append(node("div", {class:"summary-strip"},
    node("span", {class:"pill player-pill"},avatarImage(profile.avatar),node("span", {text:profile.name})),
    node("span", {class:"pill",text:t("teacherSummary",{name:teacher.name})}),
    node("span", {class:"pill",text:t(band==="preschool"?"preschoolLevel":teacher.subject)}),
    node("span", {class:"pill",text:t("starCount",{count:totalStars(profile.progress)})})));
  root.append(actionRow(button(t("difficulty"),()=>navigate("difficulty"))));
  if (profile.round) {
    root.append(node("div", {class:"notice"},node("p", {text:t(profile.round.livesLeft === 0 ? "gameOverBody" : "resumeRound")}),button(t(profile.round.livesLeft === 0 ? "reviewRound" : "continueRound"),()=>navigate("round"),"primary")),
      actionRow(button(t("mapMenu"),()=>navigate("map-options"))));app.append(root);return;
  }
  const stages=node("div", {class:"map-path section"});
  for (let stage=mapStep+1;stage<=mapStep+1;stage++) {
    const key=progressKey(teacher.subject,band,stage);
    const saved=profile.progress[key];
    const unlocked=stageUnlocked(profile.progress,teacher.subject,band,stage);
    const title=t(["stageOne","stageTwo","stageThree"][stage-1]);
    stages.append(node("article", {class:`stage-card ${unlocked?"":"locked"}`},
      node("div", {class:"stage-num","aria-hidden":"true",text:String(stage)}),
      node("div", {},node("h2", {text:title}),node("p", {class:"muted",text:saved?.completed?t("stageDone"):unlocked?t("stageReady"):t("stageLocked")}),
        saved?.completed?node("div", {},node("div", {class:"stage-stars",text:t("bestScore",{score:saved.best})}),node("span", {class:"badge",text:t(["badgeOne","badgeTwo","badgeThree"][stage-1])})):null,
        unlocked?button(saved?.completed?t("replayStage"):t("playStage"),()=>startRound(teacher.subject,band,stage),stage===1?"primary":"accent",profile.round?{disabled:"",title:t("finishRoundFirst")}:{}):null)));
  }
  root.append(stages,pageControls(()=>{mapStep--;render();},()=>{mapStep++;render();},mapStep,3),actionRow(button(t("mapMenu"),()=>navigate("map-options"))));
  app.append(root);
}

function renderMapOptions() {
  app.append(node("div", {class:"screen"},back("map"),heading(t("mapMenu")),panel(
    actionRow(button(t("changePlayer"),()=>navigate("players"),"primary"),button(t("changeTeacher"),()=>navigate("teachers")),button(t("helpSettings"),()=>navigate("help"))))));
}

function renderDifficulty() {
  const profile=activeProfile();
  if (!profile) {navigate("players");return;}
  if (profile.age<=5) {app.append(node("div", {class:"screen"},back("map"),heading(t("preschoolLevel")),panel(node("p", {text:t("preschoolIntro")}))));return;}
  const diff=node("div", {class:"chip-row"});
  for (const value of ["auto","easier","harder"]) diff.append(node("button", {type:"button",class:"chip","aria-pressed":profile.difficulty===value,onclick:() => {updateProfile({difficulty:value});render();}},t(`difficulty${value[0].toUpperCase()}${value.slice(1)}`)));
  const band=effectiveBand(profile.age,profile.difficulty);
  app.append(node("div", {class:"screen"},back("map"),heading(t("difficulty")),panel(diff,node("p", {class:"lead",text:t("actualBand",{band:t(`band${band[0].toUpperCase()}${band.slice(1)}`)})}))));
}

function startRound(subject,band,stage,teacherId=activeTeacher()?.id) {
  try {
    const profile=activeProfile(), key=progressKey(subject,band,stage);
    const round={...newRound(cards,subject,band,stage,profile.history?.[key]),teacherId};
    updateProfile({round,history:{...profile.history,[key]:selectionHistory(round)}});
    recoveredRound=false;roundView="prompt";choiceIndex=0;roundError=false;navigate("round");
  }
  catch {roundError=true;render();say(t("contentError"));}
}

function renderRound() {
  const profile=activeProfile();
  if (!profile?.round) {navigate("map");return;}
  const round=profile.round;
  if (round.livesLeft === 0) {renderGameOver(round);return;}
  if (round.index === 6) {finishRound();return;}
  const card=cards.find(item=>item.id===round.cardIds[round.index]);
  if (!card) {app.append(node("div", {class:"screen empty error"},node("h1", {text:t("contentError")}),button(t("backToMap"),()=>navigate("map"))));return;}
  const root=node("div", {class:"screen round-screen"});
  const teacher=allTeachers().find(item=>item.id===round.teacherId) || activeTeacher();
  root.append(node("div", {class:"summary-strip"},
    node("span", {class:"pill player-pill"},avatarImage(profile.avatar),node("span", {text:profile.name})),
    node("span", {class:"pill",text:t("teacherSummary",{name:teacher?.name || ""})})));
  const question=node("section", {class:"question-card"});
  question.append(node("div", {class:"question-meta"},node("span", {class:"pill",text:t("cardProgress",{current:round.index+1})}),node("span", {class:"pill",text:t("scoreNow",{score:round.score})})),
    node("div", {class:"summary-strip",role:"status"},node("span", {class:"pill",text:t("livesLeft",{count:round.livesLeft,max:round.maxLives})}),node("span", {class:"pill",text:t("hintsLeft",{count:round.hintsLeft,max:round.maxHints})})),
    node("div", {class:`progress-line step-${round.index}`,role:"progressbar","aria-valuemin":"0","aria-valuemax":"6","aria-valuenow":String(round.index),"aria-label":t("cardProgress",{current:round.index+1})},node("span")),
    node("div", {class:"eyebrow",text:t(round.band==="preschool"?"preschoolLevel":card.kind==="social"?"social":round.subject)}),
    node("h1", {class:"question-prompt",text:card.prompt}),
    node("h2", {class:"section-title",text:t("chooseAnswerTwice")}));
  if (round.band === "preschool") {
    root.classList.add("preschool-round");
    question.append(node("img", {class:"picture-reference",src:card.referenceImage,alt:card.referenceAlt,width:"200",height:"130"}));
  }
  const choices=node("div", {class:"choices"});
  card.options.forEach((option,index)=>choices.append(node("button", {type:"button",class:`choice ${(round.resolved || (round.band==="preschool" && round.hintUsed))&&option.id===card.answerId?"correct":""} ${round.wrongIds.includes(option.id)?"wrong":""} ${pendingAnswer===option.id?"pending":""}`,"aria-pressed":pendingAnswer===option.id?"true":"false",disabled:round.resolved||round.wrongIds.includes(option.id)?"":null,onclick:()=>{
    const selection=selectAnswer(pendingAnswer,option.id);
    pendingAnswer=selection.pending;
    if(!selection.confirmed) {render();document.querySelector(".choice.pending")?.focus({preventScroll:true});say(t("confirmAnswer"));return;}
    const next=answerRound(activeProfile().round,card,option.id);
    updateProfile({round:next});if(next.resolved && round.band!=="preschool") void playEncouragement(state().settings.soundEnabled);render();
    if(option.id===card.answerId && next.resolved) celebrate(state().settings.reducedMotion,celebrationCount("answer"));
    say(next.livesLeft === 0 ? t("gameOverTitle") : next.resolved?t("correct"):t("tryAgain"));
    if (next.livesLeft === 0) app.focus({preventScroll:true});
    document.querySelector(".feedback")?.focus({preventScroll:true});
  }},...(round.band==="preschool"?[node("img", {src:option.image,alt:option.text,width:"200",height:"130"})]:[node("span", {class:"choice-marker","aria-hidden":"true",text:String(index+1)}),node("span", {text:option.text})]))));
  question.append(choices);
  if (!round.resolved && !round.hintUsed) question.append(actionRow(button(t("askHint"),()=>{
    updateProfile({round:revealHint(activeProfile().round)});render();
    say(t("hintTitle"));document.querySelector(".feedback")?.focus({preventScroll:true});
  },"secondary",round.hintsLeft === 0 ? {disabled:""} : {})));
  if (round.resolved) question.append(node("div", {class:"feedback",tabindex:"-1"},node("strong", {text:t("correct")}),node("p", {},node("strong", {text:t("explanation")}),card.explanation)),actionRow(button(round.index===5?t("seeResult"):t("nextCard"),()=>{
    const advanced=advanceRound(activeProfile().round);updateProfile({round:advanced});
    if (advanced.index===6) finishRound(); else navigate("round");
  },"primary")));
  else if (round.hintUsed || round.wrongIds.length) question.append(node("div", {class:"feedback try-again",tabindex:"-1"},node("strong", {text:round.wrongIds.length?t(round.band==="preschool"?"pictureTryAgain":"tryAgain"):t("hintTitle")}),round.hintUsed ? node("p", {text:card.hint}) : null));
  root.append(question);app.append(root);
}

function renderRoundCompact() {
  const profile=activeProfile(), round=profile?.round;
  if (!round) {navigate("map");return;}
  if (round.livesLeft===0) {renderGameOver(round);return;}
  if (round.index===6) {finishRound();return;}
  if (round.resolved) roundView="feedback";
  const card=cards.find(item=>item.id===round.cardIds[round.index]);
  if (!card) {app.append(node("div", {class:"screen empty error",text:t("contentError")}));return;}
  const teacher=allTeachers().find(item=>item.id===round.teacherId)||activeTeacher();
  const root=node("div", {class:"screen compact-round"});
  root.append(node("div", {class:"compact-top"},
    node("span", {class:"pill",text:t("cardProgress",{current:round.index+1})}),
    node("span", {class:"pill",text:t("livesLeft",{count:round.livesLeft,max:round.maxLives})}),
    node("span", {class:"pill",text:t("hintsLeft",{count:round.hintsLeft,max:round.maxHints})})));
  const content=node("section", {class:`question-card compact-card ${roundView}-step`});
  if (roundView==="prompt") {
    content.append(node("div", {class:"compact-identity"},avatarImage(profile.avatar),node("span", {text:profile.name}),node("span", {class:"muted",text:t("teacherSummary",{name:teacher?.name||""})})),
      node("div", {class:"eyebrow",text:t(card.kind==="social"?"social":round.subject)}),node("h1", {class:"question-prompt",text:card.prompt}),
      actionRow(button(t("seeChoices"),()=>{roundView="choice";choiceIndex=0;render();},"primary")));
  } else if (roundView==="choice") {
    const option=card.options[choiceIndex];
    content.append(node("div", {class:"question-meta"},node("span", {class:"pill",text:t("optionCount",{current:choiceIndex+1})}),node("span", {class:"pill",text:t("scoreNow",{score:round.score})})),
      node("h1", {class:"choice-content",text:option.text}),
      actionRow(button(t("chooseThis"),()=>{
        const next=answerRound(activeProfile().round,card,option.id);
        if(next===round) return;
        updateProfile({round:next});
        if(next.resolved) void playEncouragement(state().settings.soundEnabled);
        if(next.livesLeft===0) {render();return;}
        roundView="feedback";render();say(next.resolved?t("correct"):t("tryAgain"));
      },"primary",round.wrongIds.includes(option.id)?{disabled:""}:{})),
      pageControls(()=>{choiceIndex--;render();},()=>{choiceIndex++;render();},choiceIndex,3),
      actionRow(button(t("reviewQuestion"),()=>{roundView="prompt";render();}),button(t(round.hintUsed?"reviewHint":"askHint"),()=>{
        if(round.hintUsed) {roundView="feedback";render();return;}
        const next=revealHint(activeProfile().round);
        if(next===round) return;
        updateProfile({round:next});roundView="feedback";render();say(t("hintTitle"));
      },"secondary",round.hintsLeft===0&&!round.hintUsed?{disabled:""}:{})));
  } else {
    const title=round.resolved?t("correct"):round.wrongIds.length?t("tryAgain"):t("hintTitle");
    content.append(node("h1", {text:title}),node("p", {class:"lead",text:round.resolved?card.explanation:round.hintUsed?card.hint:t("tryAnother")}),
      actionRow(button(round.resolved?(round.index===5?t("seeResult"):t("nextCard")):t("backToChoices"),()=>{
        if(round.resolved) {
          const advanced=advanceRound(activeProfile().round);updateProfile({round:advanced});roundView="prompt";choiceIndex=0;
          if(advanced.index===6) finishRound();else navigate("round");
        } else {roundView="choice";choiceIndex=card.options.findIndex(option=>!round.wrongIds.includes(option.id));render();}
      },"primary")));
  }
  root.append(content,node("div", {class:"compact-bottom"},button(t("backToMap"),()=>navigate("map")),soundButton()));
  app.append(root);
}

function renderGameOver(round) {
  const clearRound = () => {updateProfile({round:null});navigate("map");};
  app.append(node("section", {class:"screen result-card"},heading(t("gameOverTitle")),
    node("p", {class:"lead",text:t("gameOverBody")}),node("p", {text:t("gameOverScore",{score:round.score})}),
    actionRow(button(t("retryStage"),()=>{
      startRound(round.subject,round.band,round.stage,round.teacherId);
    },"primary"),button(t("newPlayerRound"),()=>{updateProfile({round:null});playerStep=0;playerPage=0;navigate("players");}),button(t("backToMap"),clearRound))));
}

function finishRound() {
  const profile=activeProfile();
  const round=profile?.round;
  if (!round || round.index!==6) {navigate("map");return;}
  resultRound=round;
  updateProfile({progress:completeStage(profile.progress,round),round:null});
  navigate("result");
  celebrate(state().settings.reducedMotion,celebrationCount("round"));
}

function renderResult() {
  if (!resultRound) {navigate("map");return;}
  const round=resultRound;
  const best=activeProfile().progress[progressKey(round.subject,round.band,round.stage)].best;
  app.append(node("div", {class:"screen result-card"},node("div", {class:"stars-large","aria-hidden":"true",text:"★ ★ ★"}),heading(t("resultTitle")),
    node("div", {class:"badge",text:t("badgeEarned",{badge:t(["badgeOne","badgeTwo","badgeThree"][round.stage-1])})}),
    node("div", {class:"result-score",text:`${round.score}/12`}),
    node("p", {class:"lead",text:t("resultLead",{score:round.score})}),
    node("p", {text:t("resultBest",{score:best})}),
    node("div", {class:"actions center"},button(t("replayRound"),()=>startRound(round.subject,round.band,round.stage,round.teacherId),"primary"),button(t("newPlayerRound"),()=>{playerStep=0;playerPage=0;navigate("players");}),round.stage<3?button(t("nextStage"),()=>{
      const teacher=activeTeacher();
      if (teacher?.subject===round.subject) startRound(round.subject,round.band,round.stage+1);
      else navigate("map");
    },"primary"):null,button(t("backToMap"),()=>navigate("map")))));
}

function renderHelp() {
  const root=node("div", {class:"screen"},back(activeProfile()&&activeTeacher()?"map":"welcome"),heading(t("helpTitle")));
  if (helpPage===0) root.append(panel(node("p", {text:t("helpOne")}),node("p", {text:t("helpTwo")})));
  if (helpPage===1) root.append(panel(node("p", {text:t("helpThree")}),node("p", {text:t("helpFour")})));
  if (helpPage===2) {
    const motion=node("input", {id:"reduce-motion",type:"checkbox",checked:state().settings.reducedMotion?"":null,onchange:event=>save({...state(),settings:{...state().settings,reducedMotion:event.target.checked}})});
    root.append(panel(node("h2", {text:t("settingsTitle")}),node("label", {class:"motion-toggle",for:"reduce-motion"},motion,node("span", {text:t("motionLabel")})),
      actionRow(soundButton(),button(t("testSound"),()=>void playEncouragement(state().settings.soundEnabled),"accent"))));
  }
  if (helpPage===3) {
    const danger=node("div", {class:"danger-zone"},node("h2", {text:t("resetTitle")}),node("p", {text:t("resetDescription")}),button(t("resetButton"),()=>{
      danger.replaceChildren(node("h2", {text:t("resetConfirm")}),actionRow(button(t("cancel"),()=>render(),"secondary"),button(t("confirmReset"),()=>{store.reset();resultRound=null;recoveredRound=false;navigate("welcome");},"danger")));
    },"danger"));root.append(danger);
  }
  root.append(pageControls(()=>{helpPage--;render();},()=>{helpPage++;render();},helpPage,4));app.append(root);
}

async function boot() {
  try {
    const [uiResponse,contentResponse,pictureResponse]=await Promise.all([fetch(new URL("../locales/ar-ui.json",import.meta.url)),fetch(new URL("../locales/ar-content.json",import.meta.url)),fetch(new URL("../locales/ar-preschool.json",import.meta.url))]);
    if (!uiResponse.ok || !contentResponse.ok || !pictureResponse.ok) throw new Error("Load failed");
    ui=await uiResponse.json();
    const content=await contentResponse.json();
    if (content.schemaVersion!==1 || !Array.isArray(content.cards)) throw new Error("Invalid content");
    const pictures=await pictureResponse.json();
    if(pictures.schemaVersion!==1 || !Array.isArray(pictures.cards)) throw new Error("Invalid picture content");
    cards=[...content.cards,...pictures.cards];
    store=createStore();
    const recovered=recoverSavedRounds(store.get(),cards);
    recoveredRound=recovered.recovered;
    if (recoveredRound) store.save(recovered.state);
    render();
    if (!isInstalled() && (deferredInstall || /iPhone|iPad|iPod|Android/.test(navigator.userAgent))) showInstallInvite();
  } catch {
    app.replaceChildren(node("section", {class:"screen empty error"},node("h1", {text:ui?.loadErrorTitle||"Game could not load"}),node("p", {text:ui?.loadErrorBody||"Check your connection and try again."}),button(ui?.retry||"Retry",()=>boot(),"primary")));
  }
}

boot();
