import * as React from "react";
import { Loader, DivFadeinCss, Tabs } from "./common";
import { LangTexts } from "./lang";
import { DB, WonProofs, GameWonProofs } from "./db";
import { Player, Lang } from "../lib/qmplayer/player";
import {
    GameState,
    initGame,
    performJump,
    Quest,
    getUIState,
    getAllImagesToPreload,
    getGameLog,
    GameLog
} from "../lib/qmplayer/funcs";
import { JUMP_I_AGREE } from "../lib/qmplayer/defs";
import { Index, Game } from "../packGameData";
import { AppNavbar } from "./appNavbar";
import {
    ButtonDropdown,
    DropdownMenu,
    DropdownToggle,
    DropdownItem
} from "reactstrap";
import {
    HashRouter,
    Switch,
    Route,
    Redirect,
    RouteComponentProps
} from "react-router-dom";
import moment from "moment";
import { replaceTags } from "./questReplaceTags";
import { substitute } from "../lib/substitution";
import { DEFAULT_DAYS_TO_PASS_QUEST } from "../lib/qmplayer/defs";
import { SRDateToString } from "../lib/qmplayer/funcs";
import classnames from "classnames";

import { DATA_DIR } from "./consts";
import { parse } from "../lib/qmreader";
import * as pako from "pako";




interface QuestPlayRealState {
    quest?: Quest,    
    gameState?: GameState,
    playingMobileView: boolean;
}
export class QuestPlay extends React.Component<{
    l: LangTexts;
    index: Index;
    player: Player;
    game: Game;

    loadInitialState: () => Promise<GameState | undefined>,

    onStateChange: (newGameState: GameState) => void,
    onReturn: () => void;
    onWin: (winningProof: GameLog) => void,

    noMusic: boolean;
    onNoMusicChange: (newNoMusic: boolean) => void,

},QuestPlayRealState> {
    state: QuestPlayRealState = {
        playingMobileView: this.isScreenWidthMobile()
    };
    isScreenWidthMobile() {
        return window.innerWidth < 400;
    }

    componentDidMount() {
        window.addEventListener("resize", this.onResize);
        this.loadData();
    }
    componentWillUnmount() {
        window.removeEventListener("resize", this.onResize);
    }


    async loadData() {
        const quest= await fetch(DATA_DIR + this.props.game.filename)
            .then(res => res.arrayBuffer())
            .then(arrayBuf => {
                const quest = parse(
                    new Buffer(pako.ungzip(new Buffer(arrayBuf)))
                ) as Quest;                
                return quest;
            });
        const gameState = (await this.props.loadInitialState()) ||
            initGame(quest, Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2));
        this.setState({
            quest,
            gameState
        })
    }

    onResize = () => {
        const isScreenWidthMobile = this.isScreenWidthMobile();
        if (this.state.playingMobileView !== isScreenWidthMobile) {
            this.setState({
                playingMobileView: isScreenWidthMobile
            });
        }
    }
    render() {

        const quest = this.state.quest;
        const gameState = this.state.gameState;
        const player = this.props.player;
        const l = this.props.l;
        const game = this.props.game;
        if (!quest || ! gameState) {
            return <Loader text={l.loadingQuest}/>
        }
        const st = getUIState(quest, gameState, player);
        const image = st.imageFileName ? (
            <DivFadeinCss key={st.imageFileName}>
                <img
                    className="game-img"
                    src={DATA_DIR + "img/" + st.imageFileName}
                />
            </DivFadeinCss>
        ) : null;

        const imagesPreloaded = getAllImagesToPreload(quest, game.images).map(
            x => {
                return (
                    <img
                        key={x}
                        src={DATA_DIR + "img/" + x}
                        style={{ display: "none" }}
                    />
                );
            }
        );

        const locationText = (
            <DivFadeinCss key={st.text + "#" + gameState.performedJumps.length}>
                {replaceTags(st.text)}
            </DivFadeinCss>
        );

        const choices = (
            <DivFadeinCss key={"#" + gameState.performedJumps.length}>
                <ul>
                    {st.choices.map(choice => {
                        return (
                            <li key={choice.jumpId} className="mb-4">
                                <a
                                    href={`#/quests/${
                                        game.gameName
                                    }/play/gameStep${choice.jumpId}`}
                                    onClick={e => {
                                        e.preventDefault();

                                        this.playAudio(false);

                                        const newState = performJump(
                                            choice.jumpId,
                                            quest,
                                            gameState,
                                            game.images
                                        );
                                        this.props.onStateChange(newState);
                                        if (getUIState(quest, newState, player).gameState === "win") {
                                            this.props.onWin(getGameLog(newState))
                                        }
                                        

                                        this.setState({
                                            gameState: newState
                                        });
                                        // todo: scroll
                                    }}
                                    className={
                                        "game " +
                                        (choice.active ? "" : "disabled")
                                    }
                                >
                                    {replaceTags(choice.text)}
                                </a>
                            </li>
                        );
                    })}
                </ul>
            </DivFadeinCss>
        );

        const params = (
            <>
                {([] as string[])
                    .concat(...st.paramsState.map(x => x.split("<br>")))
                    .map((paramText, index) => {
                        return (
                            <DivFadeinCss key={paramText + "###" + index}>
                                <div
                                    style={{
                                        whiteSpace: "pre-wrap",
                                        textAlign: "center",
                                        minHeight: "1em"
                                    }}
                                >
                                    {replaceTags(paramText)}
                                </div>
                            </DivFadeinCss>
                        );
                    })}
            </>
        );

        return (
        
                <div className="">
                    {!this.props.noMusic ? <audio
                autoPlay={false}
                controls={false}
                onEnded={e => this.playAudio(true)}
                ref={e => {
                    this.audio = e;
                    this.playAudio(false);
                }}
            /> : null}

                    <div className="row mb-1">
                        <div className="col-12 col-sm-8 mb-3">
                            {locationText}
                        </div>
                        <div className="col-12 col-sm-4 flex-first flex-sm-last mb-3">
                            {imagesPreloaded}
                            {image}
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-12 col-sm-8 mb-3">{choices}</div>
                        <div className="col-12 col-sm-4 flex-first flex-sm-last mb-3">
                            {params}
                        </div>
                    </div>
                </div>
            
        );
    }

    private audio: HTMLAudioElement | null = null;

    private playAudio(restart: boolean) {
        if (this.audio) {            
                if (!this.audio.src || restart) {
                    const musicList = this.props.index.dir.music.files.map(
                        x => x.path
                    );
                    const i = Math.floor(Math.random() * musicList.length);
                    this.audio.src = DATA_DIR + musicList[i];
                }
                
                    this.audio.play().catch(e => {
                        console.warn(
                            `Error with music src='${
                                this.audio ? this.audio.src : "no audio tag"
                            }'`,
                            e
                        );
                    });
                
            }
        
    }

}