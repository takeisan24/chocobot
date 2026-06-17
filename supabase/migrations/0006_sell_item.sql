-- ============================================================
-- 0006_sell_item.sql — Bán vật phẩm (atomic), thu về 50% giá mua.
-- Trả jsonb: {status:'ok',gain} | {status:'no_item'|'no_have'|'bad_quantity'}
-- ============================================================
create or replace function sell_item(p_user_id text, p_item_id text, p_quantity int default 1)
returns jsonb language plpgsql as $$
declare v_price bigint; v_qty int; v_gain bigint;
begin
    if p_quantity <= 0 then return jsonb_build_object('status','bad_quantity'); end if;

    select price into v_price from items where id = p_item_id;
    if v_price is null then return jsonb_build_object('status','no_item'); end if;

    select quantity into v_qty from inventory where user_id = p_user_id and item_id = p_item_id;
    if v_qty is null or v_qty < p_quantity then return jsonb_build_object('status','no_have'); end if;

    v_gain := floor(v_price * 0.5) * p_quantity;  -- bán lại 50% giá

    update inventory set quantity = quantity - p_quantity where user_id = p_user_id and item_id = p_item_id;
    delete from inventory where user_id = p_user_id and item_id = p_item_id and quantity <= 0;
    update users set wallet = wallet + v_gain where user_id = p_user_id;

    return jsonb_build_object('status','ok','gain', v_gain);
end; $$;
