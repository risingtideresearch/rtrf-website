import { BiSearch } from "react-icons/bi";
import styles from "./search.module.scss";

export default function Search() {
  return (
    <button className={'pane ' + styles.search__button}>
      <BiSearch size={18} />
    </button>
  );
}
